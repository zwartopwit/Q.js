/*
 * Q.Informer 0.1.0
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.informer.js");

Q.Informer = Class.create(Q.Base, {
  initialize: function($super, options) {
    $super();
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
    
    // add css for this plugin
    Q.addCssFor('informer');
    
    // register subclass
    Q.register('informer');
    
    // merge user options, Q.Informer options and Q default options
    this.options = $H(this.options).merge({
      closeButton:          'right',
      life: {
        plain:              10,
        info:               10,
        notice:             7,
        warning:            12,
        error:              "immortal",
        dark:               10 },
      holderStyle: {
        position:           "fixed",
        right:              "10px",
        top:                "10px",
        width:              "250px",
        zIndex:             100001 }
    }).merge(options).toObject();
    
    // generate the holder
    if (!this.div.down("div.q-holder.messages")) {
      var holder, width;
      
      if (width = parseInt(this.options.width))
        this.options.holderStyle.width = width + 'px';
      
      holder = this.holder = new Element("div").
        addClassName("q-holder messages").
        setStyle(this.options.holderStyle);
      
      this.div.insert(holder);
      
      // iphone / ipad hack for position fixed
      if (Prototype.Browser.MobileSafari) {
        var holder_width  = parseInt(this.options.holderStyle.width) || 250,
            holder_top    = parseInt(this.options.holderStyle.top) || 10,
            holder_right  = parseInt(this.options.holderStyle.right),
            holder_left   = parseInt(this.options.holderStyle.left),
            screen_width  = document.viewport.getWidth(),
            off           = document.viewport.getScrollOffsets(),
            left;
        
        holder.
          setStyle({
            position: 'absolute',
            right:    'auto'
          });
        
        _QInformerRepositionEvent = function() {
          off = document.viewport.getScrollOffsets();
          screen_width = document.viewport.getWidth();
          
          if (holder_right == 0 || holder_right)
            left = (screen_width - holder_width - holder_right - off.left) + 'px';
          else if (holder_left == 0 || holder_left)
            left = holder_left + 'px';
          else
            left = '10px';
          
          holder.
            morph('left:' + left + ';top:' + (off.top + 10) + 'px;', { duration: 0.3 });
        }
        
        window.observe('scroll', _QInformerRepositionEvent);
      }
    } else {
      this.holder = this.div.down("div.q-holder.messages");
    }
    
    // fire-up
    $w("plain info notice warning error dark").each((function(type) {
      // create methods
      this[type] = (function(message, life) {
        this.message(type, message, life);
      }).bind(this);
      // generate the messages
      $$("p.q-" + type).each((function(message) {
        var m, life;
        // detect life of a message
        if (m = message.className.match(/q-life-([\d\.]+)/))
          life = parseFloat(m[1]);
        else if (message.hasClassName("q-immortal"))
          life = "immortal";
        // generate it
        this.message(type, message.innerHTML, life);
        message.remove();
      }).bind(this));
    }).bind(this));
  },
  // create a list of messages
  messages: function(type, list, life) {
    if (!list) return;
    if (typeof list == "string" && list.isJSON())
      list = list.evalJSON();
    list.each((function(message) {
      this.message(type, message, life)
    }).bind(this));
    
    return this;
  },
  // create one message
  message: function(type, text, life) {
    var id = type + "_" + text.toMD5(),
        message, disappear, remove, close;
    
    if (!life)
      life = this.options.life[type];
    
    // build message
    if ($(id) && $(id).visible()) {
      $(id).pulsate({ pulses: 3, duration: 1 });
    } else {
      //-D this.purgeHidden();
      
      message = new Element("div", { id: id })
        .addClassName("q-message q-" + type)
        .setStyle({ width: "100%", left: "0" })
        .hide();
      message.insert(this.buildBackground(type));
      message.down(".q-center").insert(text);
      
      // close button
      if (this.options.closeButton) {
        close = new Element("div")
          .addClassName("q-message-close");
        if (this.options.closeButton == 'left')
          close
            .addClassName("q-left");
        message.insert(close);
      }
      
      // add events
      message.observe("click", (function() {
        this.disappear(message);
      }).bind(this));
      
      // insert
      this.holder.insert(message);

      if (life != "immortal")
        (this.disappear)
          .bind(this)
          .delay(life, message);
      // start
        this.appear(message);
    }
    
    return message;
  },
  // create a pending bar
  pending: function(message, id) {
    var pending, bar, text;
    if (!id)
      id = "pending_" + Math.random().toMD5();
    if ($(id)) {
      pending = $(id);
      if (!$(id).visible())
        this.holder.insert(pending.remove());
    } else {
      pending = new Element("div", { id: id })
        .addClassName("q-message q-plain q-pending")
        .setStyle({ width: "100%", left: "0" })
        .hide();
      bar = new Element("div")
        .addClassName("q-pending-bar");
      pending.insert(this.buildBackground("plain"));
      // insert text is present
      if (message && !message.blank()) {
        text = new Element("div")
          .update(message)
          .addClassName("q-text");
        pending
          .down(".q-center")
          .insert(text);
      }
      // insert
      pending
        .down(".q-center")
        .insert(bar);
      // add events
      Event.observe(pending, "click", (function() {
        this.disappear(pending);
      }).bind(this));
      pending.ready = (function() {
        this.disappear(pending);
      }).bind(this);
    }
    // start
    this.holder.insert(pending);
    this.appear(pending);
    
    return pending;
  },
  // create a progress bar
  progress: function(message, id) {
    var progress, bar, indicator, text;
    if (!id)
      id = "progress_" + Math.random().toMD5();
    if ($(id)) {
      progress = $(id);
      if (!$(id).visible())
        this.holder.insert(progress.remove());
    } else {
      progress = new Element("div", { id: id })
        .addClassName("q-message q-plain q-progress")
        .setStyle({ width: "100%", left: "0" })
        .hide();
      indicator = new Element("div")
        .addClassName("q-indicator");
      bar = new Element("div")
        .addClassName("q-progress-bar")
        .insert(indicator);
      progress.insert(this.buildBackground("plain"));
      // insert text is present
      if (message && !message.blank()) {
        text = new Element("div")
          .addClassName("q-text");
        progress
          .down(".q-center")
          .insert(text);
      }
      // insert
      progress
        .down(".q-center")
        .insert(bar);
      this.holder.insert(progress);
      
      // add events
      Event.observe(progress, "click", (function() {
        this.disappear(progress);
      }).bind(this));
      progress.update = (function(percent, new_message) {
        if (new_message)
          message = new_message;
        if (percent == 0 || (percent = parseInt(percent))) {
          if (percent >= 100) {
            progress
              .down(".q-indicator")
              .setStyle({ width: "0%" });
            this.disappear(progress);
            progress.status = 0;
          } else {
            text.update(message.gsub(/%n/, percent));
            progress
              .down(".q-indicator")
              .morph("width: " + percent + "%", { duration: 0.1 });
            progress.status = percent;
          }
        }
      }).bind(this);
      progress.ready = (function() {
        this.disappear(progress);
      }).bind(this);
      progress.update(0);
    }
    // start
    this.appear(progress);
    
    return progress;
  },
  // let a message appear
  appear: function(message) {
    if (message.visible())
      message.pulsate({ pulses: 3, duration: 0.8 });
    else {
      message.appear({ duration: 0.2 });
      if (Prototype.Browser.MobileSafari)
        _QInformerRepositionEvent();
    }
  },
  // let a message disappear
  disappear: function(message) {
    message = $(message);
    if (message.visible()) {
      message.slideUp({ duration: 0.2 });
      message.morph("margin:0;padding:0;width:0;left:100%;", { duration: 0.2 });
      var resetStyle = (function() {
        message.setStyle({ width: "100%", left: "0" });
      }).bind(this);
      resetStyle.delay(0.25);
    }
  },
  // hide all messages
  shutUp: function() {
    this.holder.select(".q-message").each((function(message) {
      this.disappear(message);
    }).bind(this));
    
    return this;
  },
  // purge all hidden messages
  purgeHidden: function(id) {
    this.holder.select(".q-message").each((function(message) {
      if (!message.visible())
        message.remove();
    }).bind(this));
  }
});

// global reposition event for mobile safari hack
var _QInformerRepositionEvent;

