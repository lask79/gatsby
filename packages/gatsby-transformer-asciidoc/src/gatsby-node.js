const asciidoc = require(`asciidoctor`)()
const _ = require(`lodash`)
const Promise = require(`bluebird`)

async function onCreateNode(
  {
    node,
    actions,
    pathPrefix,
    loadNodeContent,
    createNodeId,
    reporter,
    createContentDigest,
  },
  pluginOptions
) {
  const extensionsConfig = pluginOptions.fileExtensions

  // make extensions configurable and use adoc and asciidoc as default
  const supportedExtensions =
    typeof extensionsConfig !== `undefined` && extensionsConfig instanceof Array
      ? extensionsConfig
      : [`adoc`, `asciidoc`]

  if (!supportedExtensions.includes(node.extension)) {
    return
  }

  // changes the incoming imagesdir option to take the
  const asciidocOptions = processPluginOptions(pluginOptions, pathPrefix)
  registerExtension(asciidoc, pathPrefix, asciidocOptions)

  const { createNode, createParentChildLink } = actions
  // Load Asciidoc contents
  const content = await loadNodeContent(node)
  // Load Asciidoc file for extracting
  // https://asciidoctor-docs.netlify.com/asciidoctor.js/processor/extract-api/
  // We use a `let` here as a warning: some operations, like .convert() mutate the document
  let doc = await asciidoc.load(content, asciidocOptions)

  try {
    const html = doc.convert()
    // Use "partition" option to be able to get title, subtitle, combined
    const title = doc.getDocumentTitle({ partition: true })

    let revision = null
    let author = null

    if (doc.hasRevisionInfo()) {
      revision = {
        date: doc.getRevisionDate(),
        number: doc.getRevisionNumber(),
        remark: doc.getRevisionRemark(),
      }
    }

    if (doc.getAuthor()) {
      author = {
        fullName: doc.getAttribute(`author`),
        firstName: doc.getAttribute(`firstname`),
        lastName: doc.getAttribute(`lastname`) || ``,
        middleName: doc.getAttribute(`middlename`) || ``,
        authorInitials: doc.getAttribute(`authorinitials`) || ``,
        email: doc.getAttribute(`email`) || ``,
      }
    }

    let pageAttributes = extractPageAttributes(doc.getAttributes())

    const asciiNode = {
      id: createNodeId(`${node.id} >>> ASCIIDOC`),
      parent: node.id,
      internal: {
        type: `Asciidoc`,
        mediaType: `text/html`,
      },
      children: [],
      html,
      document: {
        title: title.getCombined(),
        subtitle: title.hasSubtitle() ? title.getSubtitle() : ``,
        main: title.getMain(),
      },
      revision,
      author,
      pageAttributes,
    }

    asciiNode.internal.contentDigest = createContentDigest(asciiNode)

    createNode(asciiNode)
    createParentChildLink({ parent: node, child: asciiNode })
  } catch (err) {
    reporter.panicOnBuild(
      `Error processing Asciidoc ${
        node.absolutePath ? `file ${node.absolutePath}` : `in node ${node.id}`
      }:\n
      ${err.message}`
    )
  }
}

const processPluginOptions = _.memoize((pluginOptions, pathPrefix) => {
  const defaultImagesDir = `/images@`
  const currentPathPrefix = pathPrefix || ``

  const clonedPluginOptions = _.cloneDeep(pluginOptions)

  if (clonedPluginOptions.attributes === undefined) {
    clonedPluginOptions.attributes = {}
  }

  clonedPluginOptions.attributes.imagesdir = withPathPrefix(
    currentPathPrefix,
    clonedPluginOptions.attributes.imagesdir || defaultImagesDir
  )

  return clonedPluginOptions
})

const withPathPrefix = (pathPrefix, url) =>
  (pathPrefix + url).replace(/\/\//, `/`)

const extractPageAttributes = allAttributes =>
  Object.entries(allAttributes).reduce((pageAttributes, [key, value]) => {
    if (key.startsWith(`page-`)) {
      pageAttributes[key.replace(/^page-/, ``)] = value
    }
    return pageAttributes
  }, {})

const registerExtension = (asciidoc, pathPrefix, pluginOptions) => {
  // Use Bluebird's Promise function "each" to run remark plugins serially.
  Promise.each(pluginOptions.plugins, plugin => {
    const requiredPlugin = require(plugin.resolve)
    if (_.isFunction(requiredPlugin)) {
      return requiredPlugin(
        {
          asciidoc,
          pathPrefix,
          pluginOptions,
        },
        plugin.pluginOptions
      )
    } else {
      return Promise.resolve()
    }
  })
}

exports.onCreateNode = onCreateNode
