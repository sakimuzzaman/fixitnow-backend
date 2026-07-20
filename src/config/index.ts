

import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const config = {
  nodeEnv: getEnv("NODE_ENV"),
  port: Number(getEnv("PORT")),
  databaseUrl: getEnv("DATABASE_URL"),

  jwt: {
    secret: getEnv("JWT_SECRET"),
    expiresIn: getEnv("JWT_EXPIRES_IN"),
  },

  bcrypt: {
    saltRounds: Number(getEnv("BCRYPT_SALT_ROUNDS")),
  },

  

  AppUrl: getEnv("APP_URL"),
};

export default config;