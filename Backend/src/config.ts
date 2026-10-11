import "dotenv/config";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
};

export const config = {
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 4000,
  jwtSecret: required("JWT_SECRET"),
};
