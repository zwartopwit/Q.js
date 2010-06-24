/*
 * Q.Window 0.1.0
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.window.js");

Q.Window = Class.create(Q.Base, {
  initialize: function($super, options) {
    $super();
    
    this.persistent = false;
    
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
    
    // merge user options, Q.Window options and Q default options
    this.options = $H(this.options).merge({
      style:        'dark',
      position:     'fixed',
      draggable:    true,
      closeButton:  'right',
      left:         50,
      top:          50,
      minWidth:     300,
      minHeight:    50,
      maxWidth:     3000,
      maxHeight:    3000,
      hide:         false
    }).merge(options).toObject();
    
    // ensure relative, absolute or fixed position
    if (this.options.position == "static" || this.options.position == "inherit")
      this.options.position = "relative";
    
    // add the css for this plugin
    Q.addCssFor('window');
    
    // register subclass
    Q.register('window');
    
    // build window
    this.build();
  },
  // build the window
  build: function() {
    var win, close, resize, title, label, background, source;
    
    win = this.holder = new Element("div");
    
    if (this.options.id)
      win.id = this.options.id;
    
    if (this.options.div)
      this.div  = $(this.options.div);
    win
      .addClassName("q-window q-" + this.options.style)
      //.setStyle(this.options.holderStyle)
      .setStyle({ position: this.options.position, left: parseInt(this.options.left) + "px", top: parseInt(this.options.top) + "px" })
      .hide();
    
    // close button
    if (this.options.closeButton) {
      close = new Element("div")
        .addClassName("q-window-close");
      if (this.options.closeButton == 'left')
        close
          .addClassName("q-left");
      close.onclick = (function() {
        this.hide(true);
      }).bind(this);
      win.insert(close);
    }
    
    // background
    background = this.buildBackground(this.options.style);
    win.insert(background);
    
    // content
    win.content = new Element("div");
    background.center.insert(win.content)
    win.center = background.center;
    
    // resize handle
    if (this.options.resizable) {
      resize = new Element("div")
        .addClassName("q-window-resize");
      win.insert(resize);
      
      resize.observe("mousedown", (function(event) {
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
        resize.resizing = true;
        
        var size = {
          width:  win.down(".q-content").getWidth(),
          height: win.down(".q-content").getHeight()
        }
        
        Q.callback('onStartResize', this, size);
        Q.callback('onResize', this, size);
      }).bind(this));
      
      document.observe("mousemove", (function(event) {
        if (resize.resizing) {
          event.preventDefault ? event.preventDefault() : event.returnValue = false;
          
          var width   = event.pointerX() - parseInt(win.getStyle("left")) - 8,
              height  = event.pointerY() - parseInt(win.getStyle("top")) - 8,
              offset;
          
          if (this.options.position == "fixed") {
            offset  = document.viewport.getScrollOffsets();
            width   -= offset.left;
            height  -= offset.top;
          }
          
          if (this.validWidth(width))
            win.down(".q-content")
              .setStyle({ width: width + "px" });
          
          if (this.validHeight(height))
            win.down(".q-content")
              .setStyle({ height: height + "px" });
          
          Q.callback('onResize', this, {
            width:  win.down(".q-content").getWidth(),
            height: win.down(".q-content").getHeight()
          });
        }
      }).bind(this));
      
      document.observe("mouseup", (function() {
        if (resize.resizing) {
          resize.resizing = false;
          
          Q.callback('onEndResize', this, {
            width:  win.down(".q-content").getWidth(),
            height: win.down(".q-content").getHeight()
          });
        }
      }).bind(this));
    }
    
    // title bar
    title = new Element("div")
      .addClassName("q-window-title");
    win.insert(title);
    
    if (this.options.draggable)
      new Draggable(win, {
        handle: title,
        zindex: 100000,
        
        onStart: (function() {
          Q.callback('onStartDrag', this);
        }).bind(this),
        
        onDrag: (function() {
          Q.callback('onDrag', this);
        }).bind(this),
        
        onEnd: (function() {
          Q.callback('onEndDrag', this);
        }).bind(this)
      });
      
      title.style.cursor = "move";
      
    if (this.options.title) {
      
      label = new Element("p")
        .addClassName("q-window-label")
        .update(this.options.title);
      title.insert(label);
    }
    
    // events
    this.holder.observe("mouseup", (function() {
      this.restack();
      Q.callback('onFocus', this);
    }).bind(this));
    
    if (trigger = $(this.options.trigger)) {
      trigger.observe("click", (function() {
        if (!this.visible())
          this.onShow();
      }).bind(this));
    } else if (!this.options.hide) {
      this.onShow();
    }
    
    this.div.insert(win);
    this.initSize(win);
    
    if (this.options.source && (source = $(this.options.source))) {
      this.update(source.innerHTML);
      source.remove();
    } else {
      this.update(this.options.text);
    }
  },
  // initialize the size
  initSize: function(win) {
    var width = 300,
        height;
    
    if (this.options.width)
      width = this.options.width;
    
    if (this.options.height)
      height = this.options.height;
    
    if (parseInt(width))
      width += "px";
    else
      width = "auto";
    
    if (parseInt(height))
      height += "px";
    else
      height = "auto";
    
    win.center
      .setStyle({
        width:      width,
        height:     height,
        minWidth:   this.options.minWidth   + "px",
        minHeight:  this.options.minHeight  + "px",
        maxWidth:   this.options.maxWidth   + "px",
        maxHeight:  this.options.maxHeight  + "px" });
  },
  // update the window content
  update: function(content) {
    this.holder.content
      .update(new Element("div")
        .setStyle({ height: "10px" }))
      .insert(content);
    return this;
  },
  // update the window content
  insert: function(content, options) {
    this.holder.content
      .insert(content, options);
    
    return this;
  },
  // is this window is visible
  visible: function() {
    return this.holder.visible();
  },
  // is it a valid width
  validWidth: function(value) {
    if (this.options.minWidth && value < this.options.minWidth)
      return false;
    if (this.options.maxWidth && value > this.options.maxWidth)
      return false;
    return true;
  },
  // is it a valid height
  validHeight: function(value) {
    if (this.options.minHeight && value < this.options.minHeight)
      return false;
    if (this.options.maxHeight && value > this.options.maxHeight)
      return false;
    return true;
  },
  // rearrange the window stack
  restack: function() {
    $("q_wrapper").select("div.q-window").each(function(win) {
      win.style.zIndex = win.hasClassName("q-window-blocking") ? 99997 : 99995;
    });
    this.holder.style.zIndex = this.holder.hasClassName("q-window-blocking") ? 99998 : 99996;
  },
  // on show callback
  onShow: function() {
    this.restack();
    
    this.show();
  }
});

Q.Alert = Class.create(Q.Window, {
  initialize: function($super, title, message, options) {
    var dim = document.viewport.getDimensions()
    
    // merge options
    options = $H({
      width:        300,
      minHeight:    30,
      draggable:    false,
      closeButton:  false,
      left:         dim.width / 2 - (options && options.width ? options.width / 2 : 150),
      top:          dim.height / 3 - 75,
      title:        title,
      confirmLabel: "Ok!"
    }).merge(options || {})
      .toObject();
    
    $super(options);
    
    // watch the trigger (if there is any) and initialize the alert
    if (trigger = $(options.trigger)) {
      trigger.observe("click", (function() {
        this.alert(title, message, options);
      }).bind(this));
    } else {
      this.alert(title, message, options);
    }
  },
  
  // build the actual alert
  alert: function(title, message, options) {
    var dim = document.viewport.getDimensions(),
        next, win, msg, wrapper, onConfirm;
    
    // on confirm
    onConfirm = (function() {
      document.stopObserving("keydown", this.confirmWithEnter);
      document.stopObserving("keydown", this.cancelWithEscape);
      document.stopObserving("keydown", this.onWindowResize);
      
      this.hide();
      
      // call optionale methods
      if (typeof this.textarea != 'undefined')
        Q.callback('onConfirm', this, this.textarea.value);
      else
        Q.callback('onConfirm', this);
      
      // completely remove this instance
      this.remove();
    }).bind(this);
    
    // watch the enter button
    this.confirmWithEnter = (function(event) {
      if (event.keyCode == 13) {
        next.focus();
        onConfirm();
      }
    }).bind(this);
    document.observe("keydown", this.confirmWithEnter);
    
    // window resize event
    this.onWindowResize = (function() {
      var dim = document.viewport.getDimensions();
      
      this.holder.setStyle({
        left: (dim.width / 2 - (options && options.width ? options.width / 2 : 150)) + 'px',
        top:  (dim.height / 3 - 75) + 'px'
      });
      
    }).bind(this);
    (document.onresize ? document : window).observe("resize", this.onWindowResize);
    
    // create blocking cover
    this.holder
      .addClassName("q-window-blocking")
      .setStyle({ zIndex: 99998 });
    
    // create protective layer
    this.protection = new Element("div")
      .addClassName("q-protective-layer");
    this.div
      .insert({ top: this.protection });
    this.protection
      .hide();
    
    // create next button
    next = new Element("input", { type: "button", value: options.confirmLabel })
      .addClassName("q-button q-next-button");
    
    next.onclick = (function() {
      onConfirm();
    }).bind(this);
    
    // clearer
    wrapper = new Element("div")
      .addClassName("q-buttons-wrapper");
    
    // create massage
    msg = new Element("div")
      .setStyle({ margin: "10px 10px 20px 10px" })
      .update(message);
    
    // insert all
    wrapper.
      insert(next);
    
    this.
      update(msg).
      insert(wrapper);
    
    this.persistent = true;
    
    
    this.show();
    this.protection.appear({ duration: 0.1, to: 0.5 });
  },
  
  // remove all elements and the instance itself as well
  remove: function() {
    this.
      protection.
      fade({ duration: 0.01 });
    
    (function() {
      try {
        this.
          protection.
          remove();
        //this.
        //  holder.
        //  remove();
        delete this;
      } catch(e) {
        // well, we've tried
      }
    }).bind(this).delay(0.2);
  }
})

Q.Confirm = Class.create(Q.Alert, {
  initialize: function($super, title, message, options) {
    
    // merge options
    options = $H({
      cancelLabel:  "Cancel"
    }).merge(options || {})
      .toObject();
    
    $super(title, message, options);
    
    // watch the trigger (if there is any) and initialize the confirm
    if (trigger = $(options.trigger)) {
      trigger.observe("click", (function() {
        
        this.confirm(options);
      }).bind(this));
    } else {
      
      this.confirm(options);
    }
  },
  
  // build the actual confirm
  confirm: function(options) {
    var cancel, clearer, onCancel;
    
    // on confirmation
    onCancel = (function() {
      document.stopObserving("keydown", this.confirmWithEnter);
      document.stopObserving("keydown", this.cancelWithEscape);
      document.stopObserving("keydown", this.onWindowResize);
      
      this.hide();

      // call optionale methods
      Q.callback('onCancel', this);

      // completely remove this instance
      this.remove();
    }).bind(this);
    
    // watch the escape button
    this.cancelWithEscape = (function(event) {
      if (event.keyCode == 27)
        onCancel();
    }).bind(this);
    document.observe("keydown", this.cancelWithEscape);
    
    // create cancel button
    cancel = new Element("input", { type: "button", value: options.cancelLabel })
      .addClassName("q-button q-cancel-button");
    
    cancel.onclick = (function() {
      onCancel();
    }).bind(this);
    
    // insert all
    this.holder
      .down("div.q-buttons-wrapper")
      .insert({ top: cancel });
  }
});

Q.Prompt = Class.create(Q.Confirm, {
  initialize: function($super, title, message, options) {
    // initialize the superclass
    $super(title, message, options);
    
    // watch the trigger (if there is any) and initialize the prompt
    if (trigger = $(options.trigger)) {
      trigger.observe("click", (function() {
        
        this.prompt(options);
      }).bind(this));
    } else {
      
      this.prompt(options);
    }
  },
  
  // build the actual prompt
  prompt: function(options) {
    // create textarea
    this.textarea = new Element("textarea")
      .addClassName("q-textarea")
      .setValue(options.text)
    
    // insert all
    this.holder
      .down("div.q-buttons-wrapper")
      .insert({ before: this.textarea });
  }
});

