/// <reference types="vite/client" />

export interface IAnnotation {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
}
export interface Text {
    content: string;
    link: null | string;
}
export type IRichTextProps = {
    type: string,
    plain_text: string,
    href: string | null,
    annotations: IAnnotation,
    text: Text;
}
export type IParagraphProps = {
    rich_text: IRichTextProps[]
}

export interface IHeading {
    rich_text: IRichTextProps[];
    is_toggleable: boolean;
    color: string;
}
export interface Code {
    caption: any[];
    rich_text: IRichTextProps[];
    language: string;
}
export interface Image {
    caption: any[];
    type: string;
    file: File;
}
export interface File {
    url: string;
    expiry_time: string;
}

export type IImageProps = Image & { id: string };
export type ICodeProps = Code & { id: string };

export interface INBlockProps {
    id: string,
    "type": "paragraph" | "heading_1" | "code" | "heading_2" | "heading_3" | "image",
    paragraph?: IParagraphProps,
    heading_1?: IHeading,
    code?: Code,
    heading_2?: IHeading,
    heading_3?: IHeading,
    image?: Image,
}




interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}