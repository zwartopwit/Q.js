/*
 * Q.Tagger 0.1.0
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.tagger.js");

Q.Tagger = Class.create(Q.Base, {
  initialize: function($super, input, options) {
    $super(input);
    
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
    
    // merge user options, Q.Tagger options and Q default options
    this.options = $H(this.options).merge({
      // the style for the wrapper
      holderStyle: {
        position: 'absolute' }
    }).merge(options).toObject();
    
    // add css for this plugin
    Q.addCssFor('tagger');
    
    // register subclass
    Q.register('tagger');
    
    // attach tagger to a given field
    if (!this.input)
      alert("Q.Tagger Error: No input was defined to attach the Tagger to!");
    else if (!this.options.tagList && !this.options.hiddenTagList)
      alert("Q.Tagger Error: No tagList was provided of hiddenTagList defined!");
    else
      this.build();
  },
  
  // customized control for this subclass
  build: function() {
    var holder  = this.createHolder(this.options.style || 'plain'),
        width   = parseInt(this.options.size) || 300,
        input   = this.input,
        self    = this,
        tags, list, item, usedTags;
    
    // track and handle
    holder.
      addClassName("q-tagger").
      setStyle(this.options.holderStyle);
    
    // create taglist
    list = new Element('ul').
      addClassName('q-taglist').
      setStyle({ width: width + 'px' });
      
    // fetch the currently selected list
    tags      = this.parseTagList();
    usedTags  = this.strip(this.input.value.split(','));
    
    // build the list
    tags.
      each(function(tag) {
        item = new Element('li').
          addClassName('q-tag').
          update(tag);
        
        if (usedTags.include(tag))
          item.
            addClassName('q-used');
        
        // add item behavior
        item.
          observe('click', function() {
            var used;
            
            if (this.hasClassName('q-used')) {
              this.
                removeClassName('q-used');
              
              self.onChange(tag, false);
            } else {
              this.
                addClassName('q-used');
              
              self.onChange(tag, true);
            }
            
            used = list.
              select('li.q-used').
              collect(function(used) {
                return used.innerHTML.strip().HTMLdecode();
              });
            
            input.value = used.join(', ');
          });
        
        // insert item into list
        list.
          insert(item);
      });
    
    // add float clearer
    item = new Element('li').
      addClassName('q-clearer').
      update('&nbsp;');
    
    // add activation behavior to input
    this.input.
      observe('keyup', function () {
        usedTags = self.strip(this.value.split(','));
        
        list.
          select('li').
          each(function(li) {
            if (usedTags.include(li.innerHTML.strip().HTMLdecode()))
              li.addClassName('q-used');
            else
              li.removeClassName('q-used');
          });
      });
    
    // insert elements
    list.
      insert(item);
    
    holder.
      down("div.q-center").
      insert(list);
  },
  
  // extend the default onChange method
  onChange: function(value, state) {
    Q.callback('onChange', this, value, state);
  },
  
  // parse the given tags
  parseTagList: function() {
    var tags;
    
    if (this.options.tagList)
      if (typeof this.options.tagList == 'string')
        if (this.options.tagList.isJSON())
          tags = this.options.tagList.parseJSON();
        else
          tags = this.options.tagList.split(',');
      else
        tags = this.options.tagList;
    else
      tags = $(this.options.hiddenTagList).value.split(',');
    
    return this.strip(tags);
  },
  
  // strip each value in a given list
  strip: function(list) {
    return list.collect(function(item) { return item.strip(); });
  }
});