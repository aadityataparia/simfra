const temp = document.createElement('template');

// binding string
export const BIND_REF_LENGTH = 8;
export const PREFIX = 'STB_';
export const REF_REG = /\${STB_(.{8})}/;
export const REF_REG_GLOBAL = /\${STB_(.{8})}/g;
export const REF_REG_EXACT = /^\${STB_(.{8})}$/;
export const REF_LENGTH = 3 /* for ${} */ + PREFIX.length + BIND_REF_LENGTH;

// dom elements
export const TEMPLATE = () => <HTMLTemplateElement>temp.cloneNode(false);
export const TREE_WALKER = () =>
  document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);

// node types
export const TEXT_NODE = Node.TEXT_NODE;
export const COMMENT_NODE = Node.COMMENT_NODE;
export const ELEMENT_NODE = Node.ELEMENT_NODE;
