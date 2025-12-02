// / <reference path="..types/importMeta.d.ts" />


interface ViteTypeOptions {
//   // Добавив эту строку, вы можете сделать тип ImportMetaEnv строгим,
//   // чтобы запретить неизвестные ключи.
//   // strictImportMetaEnv: unknown
}
interface ImportMetaEnv {
    readonly VITE_MODE_NODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}