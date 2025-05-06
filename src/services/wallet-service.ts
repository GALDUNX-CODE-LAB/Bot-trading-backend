import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from "crypto";
import { Wallet } from "ethers";

export default class WalletService {
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12;
  private readonly KEY_LENGTH = 32;
  private readonly ALGO = "aes-256-gcm";

  encryptPrivatekey(privateKey: string, password: string): string {
    const salt = randomBytes(this.SALT_LENGTH);
    const key = scryptSync(password, salt, this.KEY_LENGTH);
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
  }

  decryptPrivatekey(encryptedData: string, password: string): string {
    const data = Buffer.from(encryptedData, "base64");
    const salt = data.slice(0, this.SALT_LENGTH);
    const iv = data.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const tagStart = this.SALT_LENGTH + this.IV_LENGTH;
    const tag = data.slice(tagStart, tagStart + 16);
    const ciphertext = data.slice(tagStart + 16);
    const key = scryptSync(password, salt, this.KEY_LENGTH);
    const decipher = createDecipheriv(this.ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }

  createWallet(): { address: string; privateKey: string } {
    const wallet = Wallet.createRandom();
    return { address: wallet.address, privateKey: wallet.privateKey };
  }
}
