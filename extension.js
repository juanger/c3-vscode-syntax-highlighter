"use strict"

exports.activate = () => {
    return {
        extendMarkdownIt(md) {
            // Ruler to transform jsdoc style links into <a> tags
            // it reuses the linkify ruler tokens for links: link_open and link_close
            md.core.ruler.before('linkify', 'c3doc_links', replaceLink);

            /* 
             * Find links in the following formats:
             * 
             *      {@link url}
             *      {@link url displayedText}
             *      {@link url|displayedText}
             *      {@link url long text to display}
             */
            var regex = /\{\s*@link\s+([\w.#/:?=]+)[ |]?([^}]+)?\s*\}/g;

            function replaceLink(state) {
                var i, j, l, tokens, token,
                blockTokens = state.tokens,
                hasLink;
            
                for (j = 0, l = blockTokens.length; j < l; j++) {
                    if (blockTokens[j].type !== 'inline') { continue; }
                    tokens = blockTokens[j].children;
                    // Reverse order since we are adding tokens and it changes length and indices.
                    // This is common practice in markdown-it plugins
                    for (i = tokens.length - 1; i >= 0; i--) {
                        token = tokens[i];
                        hasLink = token.type === 'text' &&
                                  regex.test(token.content)
                        if (hasLink) {
                            // the token that has a link has to be split into multiple tokens and flattened into the tokens array
                            tokens = md.utils.arrayReplaceAt(tokens, i, splitToken(token.content, token.level, state.Token));
                            blockTokens[j].children = tokens;
                        }
                    }
                }
            }

            function splitToken(text, level, Token) {
                var tokens = [], lastMatchPos = 0, token;

                text.replace(regex, function (match, linkUrl, linkText, offset, src) {
                    linkText = linkText || linkUrl;

                    token         = new Token('text', '', 0);
                    token.content = text.slice(lastMatchPos, offset);
                    tokens.push(token);

                    token         = new Token('link_open', 'a', 1);
                    token.attrs   = [ [ 'href', linkUrl ] ];
                    token.level   = level++;
                    token.markup  = 'linkify';
                    token.info    = 'auto';
                    tokens.push(token);
          
                    token         = new Token('text', '', 0);
                    token.content = linkText;
                    token.level   = level;
                    tokens.push(token);
          
                    token         = new Token('link_close', 'a', -1);
                    token.level   = --level;
                    token.markup  = 'linkify';
                    token.info    = 'auto';
                    tokens.push(token);

                    lastMatchPos = offset + match.length
                });

                if (lastMatchPos < text.length) {
                    token         = new Token('text', '', 0);
                    token.content = text.slice(lastMatchPos);
                    tokens.push(token);
                  }

                return tokens;
            }

            return md;
        }
    }
}