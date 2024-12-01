/// <reference types="react" />
/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
} 