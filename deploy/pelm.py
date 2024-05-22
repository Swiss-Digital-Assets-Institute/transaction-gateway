#!/usr/bin/env python3
# Version: 1.0.0

import argparse
import os
from base64 import b64encode
from hashlib import md5

import requests
import yaml
from jinja2 import Environment, FileSystemLoader

VAULT_ADDR = os.getenv("VAULT_ADDR")
APPROLE_PAYLOAD = {
    "role_id": os.getenv("VAULT_ROLE_ID"),
    "secret_id": os.getenv("VAULT_SECRET_ID"),
}


def vault_login():
    if os.getenv("VAULT_TOKEN"):
        return os.getenv("VAULT_TOKEN")
    else:
        LOGIN_URL = f"{VAULT_ADDR}v1/auth/approle/login"
        return requests.post(LOGIN_URL, data=APPROLE_PAYLOAD).json()["auth"][
            "client_token"
        ]


def fetch_secret(secret_location, secret_key):
    vault_token = vault_login()
    test = requests.get(
        f"{VAULT_ADDR}v1/{secret_location}/metadata/{secret_key}",
        headers={"X-Vault-Token": vault_token},
    ).json()
    versions = requests.get(
        f"{VAULT_ADDR}v1/{secret_location}/metadata/{secret_key}",
        headers={"X-Vault-Token": vault_token},
    ).json()["data"]["versions"]
    latest_available = max(
        [int(k) for k, v in versions.items() if v["destroyed"] is False]
    )

    SECRETS_URL = f"{VAULT_ADDR}v1/{secret_location}/data/{secret_key}?version={latest_available}"
    return requests.get(SECRETS_URL, headers={"X-Vault-Token": vault_token}).json()[
        "data"
    ]["data"]


def to_yaml(d, indent=10, result=""):
    for key, value in d.items():
        result += " " * indent + f"{key}:"
        if isinstance(value, dict):
            result = to_yaml(value, indent + 2, result + "\n")
        else:
            result += " " + f"{value}" + "\n"
    return result


def base64encode(string):
    return b64encode(string.encode()).decode()


env = Environment(loader=FileSystemLoader(""), trim_blocks=True, lstrip_blocks=True)

env.filters["to_yaml"] = to_yaml
env.filters["base64encode"] = base64encode

parser = argparse.ArgumentParser(description="Render k8s templates")
parser.add_argument("--env", help="Which config environment to use.", dest="env")
parser.add_argument(
    "--registry", help="Docker registry to use for images", dest="registry"
)
parser.add_argument(
    "--app-name",
    help="Template to use for applications. Default: app",
    default="app",
    dest="app",
)
parser.add_argument(
    "--services",
    help="Services to generate the manifests for, string joined with commas",
    dest="services",
)
parser.add_argument("--image-tag", help="What tag to set for the image", dest="tag")
parser.add_argument(
    "--workers", help="List of worker images", dest="workers", default=""
)
parser.add_argument(
    "--file-prefix",
    help="Prefix used to find all templates and configs",
    dest="prefix",
    default="",
)
args = parser.parse_args()

app_template = env.get_template(f"./deploy/{args.prefix}templates/deployment.yml")
secret_template = env.get_template(f"./deploy/{args.prefix}templates/secret.yml")

common_secret_hash = ""

secret_configs = yaml.safe_load(open(f"./deploy/{args.prefix}config/secrets.yml").read())[
    args.env
]

for config in secret_configs:
    with open(f"./out/00-env-{config['name']}.yml", "w+") as fh:
        config["app"] = config['name']
        config["secrets"] = fetch_secret(config["secretLocation"], config["secretKey"])
        rendered = secret_template.render(config)
        common_secret_hash = md5(rendered.encode("utf-8")).hexdigest()
        fh.write(rendered)

for service in args.services.split(","):
    config = yaml.safe_load(open(f"./deploy/{args.prefix}config/{service}.yml").read())[
        args.env
    ]
    if config.get("secretLocation") and config.get("secretKey"):
        config["secrets"] = fetch_secret(config["secretLocation"], config["secretKey"])
    config["app"] = args.app
    config["env"] = args.env
    config["image"] = args.registry + config["imageName"] + ":" + config["tag"]
    if config["digest"]:
        config["image"] = config["image"] + "@" + config["digest"]
        
    config["hash"] = common_secret_hash

    with open(f"./out/01-{service}.yml", "w+") as fh:
        fh.write(app_template.render(config))
