const prismExtension = require(`asciidoctor-prism-extension`)

module.exports = ({ asciidoc }, pluginOptions) => {
  asciidoc.SyntaxHighlighter.register(`prism`, prismExtension)
}
