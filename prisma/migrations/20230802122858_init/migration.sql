-- CreateTable
CREATE TABLE "User" (
    "UserId" SERIAL NOT NULL,
    "Email" TEXT NOT NULL,
    "FirstName" TEXT,
    "LastName" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");