import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashUtil = {
    async sifrele(sifre: string): Promise<string> {
        return bcrypt.hash(sifre, SALT_ROUNDS);
    },

    async karsilastir(sifre: string, hash: string): Promise<boolean> {
        return bcrypt.compare(sifre, hash);
    }
}