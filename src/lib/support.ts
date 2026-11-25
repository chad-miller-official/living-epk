import type {EpkApp} from "../components/app.ts";

type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
export type EpkAppConstructor = AbstractConstructor<EpkApp>