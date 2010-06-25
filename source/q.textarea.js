/*
 * Q.Textarea 0.1.1
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.textarea.js");

Q.Textarea = Class.create({
  availableButtons: $w('Heading Bold Italic Underline StrikeThrough CreateLink InsertImage JustifyLeft JustifyCenter JustifyRight JustifyFull Indent Outdent ForeColor InsertUnorderedList InsertOrderedList RemoveFormat EditCode'),
  
  initialize: function(textarea, options) {
    
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
      
    // merge user options
    this.options = $H(this.options).merge({
      className:  'q-textarea',
      forecolor:  'palette',
      backcolor:  'palette'
    }).merge(options).toObject();
    
    // add css for this plugin
    Q.addCssFor('textarea');
    
    // register subclass
    Q.register('textarea');
    
    this.build(textarea);
  },
  
  // create the editor
  build: function(textarea) {
    var blankBody, styleSheet, diffDim, headingSelect,
        oldarea   = $(textarea),
        width     = this.options.width   || oldarea.getWidth(),
        height    = this.options.height  || oldarea.getHeight(),
        buttons   = this.options.buttons || this.availableButtons;
    
    // calculate the difference in dimensions between the given width and a textarea set to that width
    // (to compensate the margins and padding)
    diffDim = oldarea.
      setStyle({
        width: width + 'px',
        height: height + 'px'
      }).getDimensions();
    
    diffDim.width  -= width;
    diffDim.height -= height;
    
    // set some static vars
    this.toolbarButtons = {};
    this.active   = true;
    
    this.oldCaret = false;
    this.codearea = oldarea.cloneNode(true);
    this.holder   = new Element('div');
    this.toolbar  = new Element('ul');
    this.editor   = new Element('iframe');
    
    // theplace the old textarea with the holder
    oldarea.replace(this.holder);
    
    // add a classname to the holder and gice it the correct width
    this.holder.
      addClassName('q-textarea-wrapper').
      setStyle({ width: width + 'px' }).
      hide();
    
    if (oldarea.className)
      this.holder.addClassName(oldarea.className);
    
    this.holder.id    = oldarea.id;
    oldarea.id        = '';
    this.codearea.id  = '';
    
    // insert the iframe in the holder
    this.holder.insert(this.editor);
    
    // hide the new area, it will serve as a data container
    this.codearea.
      hide().
      setStyle({
        width:  (width  - diffDim.width)  + 'px',
        height: (height - diffDim.height) + 'px'
      });
    
    // insert the new area before the editor
    // note: since 'insert()' doesn't work on a textarea, it has been cloned and replaced
    this.editor.
      insert({ before: this.toolbar }).
      setStyle({
        width:  (width - 2)  + 'px',
        height: (height - 2) + 'px'
      });
    
    // create the toolbar
    this.toolbar.
      insert({ after: this.codearea }).
      addClassName('q-textarea-toolbar').
      setStyle({
        width:  width + 'px'
      });
    
    // set custom icon class
    if (this.options.icons)
      this.toolbar.addClassName(this.options.icons);
    
    // add buttons
    buttons.uniq().each((function(action) {
      var li, option, input, pick, change;
      
      if (this.availableButtons.indexOf(action) > -1) {

        // create button
        li = new Element('li', { unselectable: 'on', title: Q.I18n.t('textarea.tooltips.'+ action.underscore(), { fallback: action.humanize() }) }).
          addClassName('button').
          addClassName('q-tip').
          addClassName(action.underscore().dasherize());

        // add custom content
        switch(action) {
          default:
            li.insert('&nbsp;')
          break;
          case 'Heading':
            // create a heading select
            headingSelect = new Element('ul').
              addClassName('heading-options').
              hide();

            // add the default options, being 'div'
            option = new Element('li', { unselectable: 'on', title: 'Default' }).
              addClassName('q-tip button option div');
            
            headingSelect.insert(option);
            
            option.onclick = (function() {
              this.perform(action, 'div');
              headingSelect.hide();
            }).bind(this);

            // add heading options h1 - h6
            $R(1,6).each((function(i) {
              option = new Element('li', { unselectable: 'on', title: 'Heading ' + i }).
                addClassName('q-tip button option h' + i);
              
              headingSelect.insert(option);
              
              option.onmousedown = (function() {
                this.perform(action, 'h' + i);
                headingSelect.hide();
              }).bind(this);
            }).bind(this));
            
          break;
          case 'ForeColor':
            // create the invisible yet present input field
            input = new Element('input').
              addClassName('q-editor-color-field');
            
            // pick callback
            pick = (function(value) {
              this.perform(action, value);
            }).bind(this);
            
            // if the user selected 'picker'
            if (this.options[action.toLowerCase()] == 'picker') {
              // when a picker is defined create a picker instance
              new Q.Picker(input, {
                size:     150,
                onShow:   function() {
                  li.addClassName('active')
                },
                onPick:   pick,
                onChange: (function(value, instance) {
                  if (this.oldCaret)
                    this.oldCaret.range.select();
                  
                  pick(value);
                }).bind(this),
                onHide:   function() {
                  li.removeClassName('active')
                }
              });

            } else if (this.options[action.toLowerCase()] == 'palette') {
              // when palette is defined (default) create a palette instance
              new Q.Palette(input, {
                swatchSize:   13,
                swatchSpace:  1,
                colors:       this.options[action.toLowerCase() + 's'],
                onShow:   function() {
                  li.addClassName('active')
                },
                onChange: (function(value, instance) {
                  if (this.oldCaret)
                    this.oldCaret.range.select();
                  
                  pick(value);
                  
                  instance.close();
                }).bind(this),
                onHide:   function() {
                  li.removeClassName('active')
                }
              });

            }

            li.insert(input);
            
            // save the caret on IE (selection will be lost when focused on anorther element)
            if (Q.IE)
              li.onmouseover = (function() {
                this.oldCaret = this.getCaret();
              }).bind(this);
          break;
        }
        
        // insert and buffer the button
        this.toolbar.insert(li);
        this.toolbarButtons[action.underscore()] = li;
        
        // add some custom actions
        li.onclick = (function() {
          switch(action) {
            default:
              this.perform(action);
            break;
            case 'EditCode':
              this.toggleToolbarState();
            break;
            case 'Heading':
              if (this.active) {
                var observeBlur, offset;

                // close the heading select if anywhere is clicked in the document
                observeBlur = function() {
                  headingSelect.hide();
                  document.stopObserving('mouseup', observeBlur);
                }
                document.observe('mouseup', observeBlur);

                offset = li.positionedOffset();

                Q.addCss(
                  'ul.q-textarea-toolbar li.q-heading-select',
                  'left:' + offset.left + 'px; top:' + offset.top + 'px;');

                headingSelect.show();
              }
            break;
            case 'ForeColor':
              // do nothing
            break;
          }
        }).bind(this);
        
      }
    }).bind(this));
    
    // insert a clearer for the buttons
    this.toolbar.
      insert(
        new Element('li').
          addClassName('q-clearer').
          update('&nbsp;')
      );
    
    // if a headingSelect is defined, insert it
    if (headingSelect)
      this.toolbar.
        insert(
          new Element('li').
            addClassName('q-heading-select').
            update(headingSelect)
        );
    
    this.doc = this.editor.contentWindow.document;
    
    // create a blank body in the editor iframe
    blankBody = '<html><head>';
    
    // create an inline stylesheet when IE
    if (!this.options.styleSheet && Q.IE) {
      blankBody += '<link href="' + this.options.styleSheet + '" rel="stylesheet" type="text/css"></link>';
    }
    
    blankBody += '<title>Q.Textarea Editor</title></head><body id="q_editor">';
    blankBody += this.codearea.value;
    blankBody += '</body></html>';
    
    // insert the content of the iframe document
    this.doc.open();
    this.doc.write(blankBody);
    this.doc.close();
    
    // initialize editor capabilities
    this.editorInitializationCount = 0;
    this.initializeEditor();
    
    // build a stylesheet for non-IE browsers
    if (this.options.styleSheet && !Q.IE) {
      styleSheet = this.doc.createElement('link');
      styleSheet.setAttribute('rel',  'stylesheet');
      styleSheet.setAttribute('type', 'text/css');
      styleSheet.setAttribute('href', this.options.styleSheet);
      this.doc.getElementsByTagName('head')[0].appendChild(styleSheet);
    }
  },
  
  // inialize designMode
  initializeEditor: function() {
    // try to switch on design mode for 10 times
    try {
      this.doc.designMode = "on";
      
      this.addEditorFunctions();

      this.addCss('p, div', 'margin:0;padding:0;');
      
      if (this.options.css)
        this.addCss(this.options.css);
      
      this.holder.appear({ duration: 0.2 });

      Q.callback('onLoad', this);
      
    } catch (e) {
      if (this.editorInitializationCount < 10) {
        (function() {
          this.initializeEditor();
        }).
          bind(this).
          delay(0.1);
        
        this.editorInitializationCount += 1;
      } else {
        // alert("Q.Textarea error: The editor could not be initialized. Probably your browser doesn't support the necessary functionality.")
      }
      
      return false;
    }
  },
  
  // add functions 
  addEditorFunctions: function() {
    
    // add dynamic stylesheet methods to the iframe's document
    Q.addDynamicStylesheetMethodsTo(this.doc);
    
    // create a dynamic stylesheet
    this.editor.contentWindow.css = this.doc.createStyleSheet();
    
    if (typeof this.doc.addEventListener == 'function') {
      // events for friendly browsers
      this.doc.addEventListener('mouseup', (function() {
        this.setButtonState();
        return true;
      }).bind(this), false);
      
      this.doc.addEventListener('keyup', (function() {
        this.setButtonState();
        this.sync();
        return true;
      }).bind(this), false);
    } else {
      // events for IE
      this.doc.attachEvent('onmouseup', (function() {
        this.setButtonState();
        return true;
      }).bind(this));
      
      this.doc.attachEvent('onkeyup', (function(){
        this.setButtonState();
        this.sync();
        return true;
      }).bind(this));
    }
    
    // add keyup event to the code area
    this.codearea.observe('keyup', (function() {
      this.sync();
    }).bind(this));
  },
  
  // create the editor window's addCss method
  addCss: function(targets, cssText) {
    if (typeof targets == 'string') {
      targets.
        split(',').
        collect(function(part) {
          return part.strip();
        }).
        each((function(selector) {
          this.editor.
            contentWindow.
            css.
            addRule(selector, cssText);
        }).bind(this));
    
    } else if (typeof targets == 'object') {
      $H(targets).each((function(pair) {
        
        if (typeof pair.value == 'object') {
          cssText = '';
          
          $H(pair.value).each(function(p) {
            cssText += p.key.underscore().dasherize() + ':' + p.value + ';';
          });
        } else {
          cssText = pair.value;
        }
        
        this.editor.
          contentWindow.
          css.
          addRule(pair.key, cssText);
      }).bind(this));
    
    }
  },
  
  // send the command to the editor
  perform: function(action, value) {
    if (!this.active) return false;
    
    var button = this.toolbar.down('li.' + action.underscore().dasherize());
    
    switch(action) {
      default:
        this.doc.execCommand(action, false, null);
        
        if (button.hasClassName('active'))
          button.removeClassName('active');
        else
          button.addClassName('active');
        
      break;
      
      case 'RemoveFormat':
        var html,
            caret = this.getCaret(),
            node  = caret.node;
        
        // remove some the code with the default method
        this.doc.execCommand(action, false, null);
        
        if (caret.selection != '') {
          if (node.nodeName == '#text')
            node = node.parentNode;
          
          // if the selected node is a heading, convert it to div
          if (node.nodeName.match(/h[\d]/i))
            this.doc.execCommand('FormatBlock', false, '<div>');
          
          // strip out all html code left
          node.innerHTML = node.innerHTML.stripScripts().stripTags();
          
          // remove inline styles and other attributes
          $w('style align STYLE ALIGN').each(function(attribute) {
            node.setAttribute(attribute, '');
            node.removeAttribute(attribute);
          });
        }
        
        // deactivate all buttons
        this.toolbar.select('li').each(function(button) {
          button.removeClassName('active');
          
          if (button.hasClassName('heading')) {
            $R(1,6).each(function(i) {
              button.removeClassName('h' + i);
            });
          }
        });
      break;
      
      case 'Heading':
        $R(1,6).each((function(i) {
          this.toolbarButtons.heading.removeClassName('h' + i);
        }).bind(this));
        
        this.toolbarButtons.heading.addClassName(value);
        
        this.doc.execCommand('FormatBlock', false, '<' + value + '>');
      break;
      
      case 'Indent':
      case 'Outdent':
        this.doc.execCommand(action, false, null);
      break;
      
      case 'JustifyLeft':
      case 'JustifyCenter':
      case 'JustifyRight':
      case 'JustifyFull':
        this.doc.execCommand(action, false, null);
        
        $w('left center right full').each((function(type) {
          this.toolbarButtons['justify_' + type].removeClassName('active');
        }).bind(this));
        
        button.addClassName('active');
      break;
      
      case 'ForeColor':
        var caret = this.getCaret(),
            node  = caret.node;
        
        if (caret.selection != '') {
          
          // focus the editor
          this.editor.focus();
          
          // if a span is selected
          if (node.nodeName == 'SPAN')
            // change the style
            node.setAttribute('style', 'color:' + value + ';')
          else
            // insert a new span
            this.insertHTML('<span style="color:' + value + ';">' + caret.text + '</span>');
          
        }
      break;
      
      case 'CreateLink':
        var win, text, message, promptUrl, alertInvalidUrl;
        
        if (Q.IE)
          this.oldCaret = this.getCaret();
        
        // prompt method
        promptUrl = (function() {
          // create a message with checkbox
          message = '<input type="checkbox" name="q_new_window_check" class="target-check" /> open link in a new window?';

          // open a prompt to enter the link
          win = new Q.Prompt('Link', message, {
            text: 'http://',
            onConfirm: (function(link) {
              // verify the format of the url
              if (link.blank() || link == 'http://') {
                alertInvalidUrl();
                
              } else {
                var anchor,
                    caret = this.oldCaret || this.getCaret();
                
                if (caret.selection != '') {
                  // build link
                  anchor = '<a href="' + link + '"';
                  if (win.holder.down('input.target-check').checked)
                    anchor += ' target="_blank"';
                  
                  anchor += '>';
                  anchor += caret.text;
                  anchor += '</a>';
                  
                  // insert link
                  this.insertHTML(anchor);

                }
                
                this.sync();
              }
              
            }).bind(this)
          });
        }).bind(this);
        
        // alert when url invalid
        alertInvalidUrl = (function() {
          new Q.Alert('', Q.I18n.t('textarea.create_link.invalid_link', { fallback: 'The link you entered is invalid, please try again.' }), {
            onConfirm: (function() {
              promptUrl();
              
            }).bind(this)
          });
        }).bind(this);
        
        // check if the link button is already active
        if (this.toolbarButtons.create_link.hasClassName('active')) {
          
          this.doc.execCommand('Unlink', false, null);
          this.toolbarButtons.create_link.removeClassName('active');
          
        } else {
          // get the selection
          if (this.doc.selection)
            text = this.doc.selection.createRange().text;
          else
            text = this.editor.contentWindow.getSelection();
          
          // if no text is selected, in form the user to do so
          if (text == '') {
            new Q.Alert('', Q.I18n.t('textarea.create_link.select_text', { fallback: 'Please first select a part of the text you want to be linked.' }));
            break;
          }
          
          promptUrl();
          
        }
      break;
      
      case 'InsertImage':
        var promptUrl, alertUrl, promptAlt, imageUrl, imageAlt, insertImage;
        
        if (Q.IE)
          this.oldCaret = this.getCaret();
        
        // prompt for an image url
        promptUrl = (function() {
          new Q.Prompt(
            Q.I18n.t('textarea.insert_image.image',     { fallback: 'Image' }),
            Q.I18n.t('textarea.insert_image.enter_url', { fallback: 'Enter the url of the image you want to insert:' }),
            {
            text: 'http://',
            onConfirm: (function(value) {
              var match;

              // if a valid url is given, open a promt for the alt text
              if (match = value.match(/^https?:\/\/[a-z0-9\-]+\.[a-z0-9\-]+(.*?)\/(.*)\.[a-z]{2,4}(\?.*)?$/i)) {
                imageUrl = value;
                imageAlt = match[2].split('/').last().gsub(/(\-|\.|\+|_)/, ' ');
                
                promptAlt();
              } else {
                alertUrl();
              }

            }).bind(this)
          });
        }).bind(this);
        
        alertUrl = function() {
          new Q.Alert(
            Q.I18n.t('textarea.insert_image.image',       { fallback: 'Oops!' }),
            Q.I18n.t('textarea.insert_image.invalid_url', { fallback: 'The image address you entered is not correct, try again.' }),
            { onConfirm: promptUrl }
          );
        }
        
        // prompt for an image alt
        promptAlt = (function() {
          new Q.Prompt(
            Q.I18n.t('textarea.insert_image.description', { fallback: 'Description' }),
            Q.I18n.t('textarea.insert_image.image_alt',   { fallback: 'Excellent! Now enter a description:' }),
            {
            text: imageAlt,
            onConfirm: (function(value) {
              
              imageAlt = value.HTMLencode();
              insertImage();
              
            }).bind(this)
          });
        }).bind(this);
        
        // insert the image
        insertImage = (function() {
          this.insertHTML('<img alt="' + imageAlt + '" src="' + imageUrl + '" />');
          this.sync();
        }).bind(this);
        
        promptUrl();
        
      break;
    }
    
    this.sync();
  },
  
  // insert html in the currently selected range
  insertHTML: function(html) {
    if (Q.IE) {
      var range = this.oldCaret.range;
      range.pasteHTML(html);
      range.collapse(false);
      range.select();
    } else {
      this.doc.execCommand('insertHTML', false, html);
    }
  },
  
  // when repositioning the cursor or making another selection, activate the relevant buttons
  setButtonState: function() {
    (function() {
      var selection, range, parentNode,
          level = 0;
      
      // deactivate all buttons
      this.toolbar.select('li').each(function(button) {
        button.removeClassName('active');
      });
      
      // remove all h classnames
      if (this.toolbarButtons.heading)
        $R(1,6).each((function(i) {
          this.toolbarButtons.heading.removeClassName('h' + i);
        }).bind(this));
      
      // get selection
      if (this.doc.selection) {
        // IE
        selection = this.doc.selection;
        range     = selection.createRange();
        
        try {
          parentNode = range.parentElement();
        } catch (e) {
          return false;
        }
      } else {
        // all other browsers
        try {
          selection = this.editor.contentWindow.getSelection();
        } catch (e) {
          return false;
        }

        range       = selection.getRangeAt(0);
        parentNode  = range.commonAncestorContainer;
      }
      
      // go to the to level text node
      while (parentNode.nodeType == 3) {
        parentNode = parentNode.parentNode;
      }
      
      // activate button when the current selection contains it's action
      while (parentNode.nodeName != 'BODY') {
        switch (parentNode.nodeName.toLowerCase()) {
          case 'a':
            this.toolbarButtons.create_link.addClassName('active');
          break;
          
          case 'b':
          case 'strong':
            this.toolbarButtons.bold.addClassName('active');
          break;
          
          case 'i':
          case 'em':
            this.toolbarButtons.italic.addClassName('active');
          break;
          
          case 'u':
            this.toolbarButtons.underline.addClassName('active');
          break;
          
          case 's':
          case 'strike':
            this.toolbarButtons.strike_through.addClassName('active');
          break;
          
          case 'ol':
            this.toolbarButtons.insert_ordered_list.addClassName('active');
            this.toolbarButtons.insert_unordered_list.removeClassName('active');
          break;
          
          case 'ul':
            this.toolbarButtons.insert_unordered_list.addClassName('active');
            this.toolbarButtons.insert_ordered_list.removeClassName('active');
          break;
          
          case 'li':
          break;
          
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            // add the selected classname
            if (this.toolbarButtons.heading)
              this.toolbarButtons.
                heading.
                addClassName(parentNode.nodeName.toLowerCase());
          break;
          
          case 'div':
            if (parentNode.getAttribute('style')) {
              var style, match;
              
              style = parentNode.
                getAttribute('style').
                toString();
                
              match = style.match(/text\-align: ?(left|center|right|justify);/i);

              if (match) {
                switch (match[1]) {
                  default:
                    this.toolbarButtons['justify_' + match[1]].addClassName('active');
                  break;
                  case 'justify':
                    this.toolbarButtons.justify_full.addClassName('active');
                  break;
                }
              }
            }
          break;
        }
        
        parentNode = parentNode.parentNode;
        level++;
      }
      
      return true;
      
      
    }).bind(this).delay(0.1);
  },
  
  // deactivate / activate the toolbar
  toggleToolbarState: function() {
    if (this.active) {
      this.toolbar.select('li').each(function(button) {
        if (button.hasClassName('q-heading-select')) {
          button.
            down('ul').
            hide();
        } else if (button.hasClassName('edit-code')) {
          button.
            addClassName('active');
        } else {
          button.
            removeClassName('active').
            addClassName('inactive');
          
          if (button.hasClassName('fore-color'))
            button.
              down('input').
              hide();
        }
      });
      
      this.codearea.show();
      this.editor.hide();
      
      this.active = false;
    } else {
      this.toolbar.select('li').each(function(button) {
        button.
          removeClassName('active').
          removeClassName('inactive');
        
        if (button.hasClassName('fore-color'))
          button.
            down('input').
            show();
      });
      
      this.codearea.hide();
      this.editor.show();
      
      this.active = true;
    }
  },
  
  // sync the textfield and editor
  sync: function(thorough) {
    var body = this.doc.getElementById('q_editor');
    
    // sync the fields
    if (this.active)
      this.codearea.setValue(this.polishCode(body.innerHTML));
    else
      body.innerHTML = this.polishCode(this.codearea.value);
    
    Q.callback('onType', this);
    
    // sync the editor with the content of the textarea
    if (this.active && thorough)
      this.doc.getElementById('q_editor').innerHTML = this.codearea.value;
  },
  
  // remove unwanted elements for the code
  polishCode: function(code) {
    return code.
      // remove the embed tag entered by safari tidy ()
      gsub(/<embed width="0" height="0" type="application\/x-safari-validator">/i, '').
      
      // replace div's holding only a break or a space entity by a properly closed break
      gsub(/<div>(<br>|&nbsp;)<\/div>/i, '<br/>').
      
      // properly close breaks
      gsub(/<br ?>/i, '<br/>').
      
      // replace paragraphs with divs to be consistent in all browsers (Safari makes DIV's, Opera P's for example)
      gsub(/<p(.*)?>/i, function(match) {
        return '<div' + match[1] + '>';
      }).
      gsub(/<\/p>/i, '</div>');
  },
  
  // get the current value
  getValue: function() {
    this.sync(true);
    
    return this.doc.getElementById('q_editor').innerHTML;
  },
  
  // replace the current value
  setValue: function(value) {
    this.doc.getElementById('q_editor').innerHTML = value;
    this.codearea.setValue(value);
  },
  
  // get all caret info in an object
  getCaret: function() {
    var caret = { node: null };
    
    if (this.doc.selection) {
      // IE
      caret.selection = this.doc.selection;
      
      if (caret.selection == '') return caret;
      
      caret.range     = caret.selection.createRange();
      caret.node      = caret.range.parentElement();
      caret.text      = caret.range.text;
    } else {
      // all other browsers
      caret.selection = this.editor.contentWindow.getSelection();
      
      if (caret.selection == '') return caret;
      
      caret.range     = caret.selection.getRangeAt(0);
      caret.node      = caret.range.commonAncestorContainer;
      caret.text      = caret.selection;
    }
    
    return caret;
  }
});

