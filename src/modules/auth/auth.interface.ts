export type IUserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: IUserRole;
  phone?: string;
  location?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: IUserRole;
}