/*
 * Q.Slider 0.1.1
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.slider.js");

Q.Slider = Class.create(Q.Base, {
  initialize: function($super, input, options) {
    $super(input);
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
    // merge user options, Q.Slider options and Q default options
    this.options = $H(this.options).merge({
      delimiter:  '',
      separator:  '',
      prefix:     '',
      suffix:     '',
      
      // the style for the wrapper
      holderStyle: {
        position:           "absolute" },
      // track style
      trackStyle: {
        backgroundImage:    "url(" + Q.imagePath_h + ")",
        backgroundRepeat:   "repeat-x",
        backgroundPosition: "0 -197px",
        width:              "200px",
        height:             "3px",
        position:           "absolute",
        left:               "15px",
        top:                "22px" },
      trackStyleVertical: {
        backgroundImage:    "url(" + Q.imagePath_v + ")",
        backgroundRepeat:   "repeat-y",
        backgroundPosition: "-197px 0",
        width:              "3px",
        height:             "200px",
        position:           "absolute",
        left:               "21px",
        top:                "15px" },
      // handle style
      handleStyle: {
        backgroundImage:    "url(" + Q.imagePath_h + ")",
        backgroundRepeat:   "no-repeat",
        backgroundPosition: "0px -168px",
        width:              "24px",
        height:             "24px",
        position:           "relative",
        marginTop:          "-11px",
        marginLeft:         "0px",
        cursor:             "pointer" },
      handleStyleVertical: {
        marginTop:          "0px",
        marginLeft:         "-11px" }
    }).merge(options).toObject();
    
    // match the format option
    if (this.options.format) {
      this.options.format = this.options.format.match(/^(.*?)([\d]+)(.([\d]+))?(.*?)$/);
      
      // format match result: 1 = prefix, 3 = delimiter, 6 = separator, 7 = precision, 8 = suffix
      //-F var m = this.options.format = this.options.format.match(/^([^\d]+)?([\d]([^\d]))?([\d]{1,3})(([^\d])([\d]+))?([^\d]+)?$/);
      //-F 
      //-F if (m[1])
      //-F   this.options.prefix = m[1];
      //-F 
      //-F if (m[3])
      //-F   this.options.delimiter = m[3];
      //-F 
      //-F if (m[6])
      //-F   this.options.separator = m[6];
      //-F 
      //-F if (m[7])
      //-F   this.options.precision = m[7].length;
      //-F 
      //-F if (m[8])
      //-F   this.options.suffix = m[8];
      //-F 
      //-F console.log(this.options.prefix, this.options.delimiter, this.options.separator, this.options.precision, this.options.suffix)
    }
    
    // register subclass
    Q.register('slider');
    
    // attach slider to a given field or else to any field with a given or the default class
    if (!this.input)
      alert("Q.Slider Error: No input was defined to attach the Slider to!");
    else
      this.build();
  },
  // customized control for this subclass
  build: function() {
    var holder  = this.createHolder("plain"),
        track   = new Element("div"),
        handle  = new Element("div"),
        size    = parseInt(this.options.size) || 200,
        options;
    
    this.options.trackStyle.width = size + "px";
    this.options.trackStyleVertical.width = size + "px";
    
    // track and handle
    holder.
      addClassName("slider").
      setStyle(this.options.holderStyle).
      insert(track);
      
    track.
      addClassName("q-track").
      insert(handle).
      setStyle(this.options.trackStyle);
    
    handle.
      addClassName("q-handle").
      setStyle(this.options.handleStyle);
    
    if (this.options.axis == "vertical") {
      holder.
        setStyle(this.options.holderStyleVertical).
        down("div.q-center").
        setStyle({ width: "20px", height: (size + 8) + "px" });
      
      track.
        setStyle(this.options.trackStyleVertical);
      
      handle.
        setStyle(this.options.handleStyleVertical);
    } else {
      holder.
        down("div.q-center").
        setStyle({ width: (size + 8) + "px", height: "20px" });
    }
    
    // add input behavior
    this.input.observe("blur", (function() {
      this.input.value = this.format(this.options.value);
    }).bind(this));
    
    // manipulate value with arrow keys
    this.input.observe("keyup", (function(event) {
      // close window on enter button
      if(event.keyCode == 13)
        this.hide();
      this.options.value = this.input.value;
    }).bind(this));
    
    // apply slider
    options = $H(this.options).merge({
      onChange: this.onChange.bind(this),
      onSlide:  this.onSlide.bind(this)
    }).toObject();
    
    this.control = new Control.Slider(handle, track, options);
    this.setValue(this.options.value || this.input.value || 0);
  },
  // extend the default onChange method
  onChange: function(value) {
    if (value == 0 || value) {
      this.input.setValue(this.format(value));
      this.options.value = value;
      this.positionHolder();
      
      Q.callback('onChange', this, value);
    }
  },
  // extend the default onSlide method
  onSlide: function(value) {
    if (value == 0 || value) {
      this.input.setValue(this.format(value));
      this.options.value = value;
      
      Q.callback('onSlide', this, value);
    }
  },
  // set the value of the slider
  setValue: function(value) {
    if (value == 0 || parseFloat(value)) {
      this.control.setValue(parseFloat(value));
      this.input.setValue(this.format(value));
      this.options.value = value; }
  },
  // output format
  format: function(value) {
    if (m = this.options.format) {
      if (!m[4])
        value = parseInt(value);
      else
        value = parseFloat(value).toFixed(m[4].length);
      return (m[1] || "") + value + (m[5] || "");
    } else {
      return value;
    }
    
    //-F if (this.options.format) {
    //-F   return parseFloat(value).withFormat({
    //-F     prefix:     this.options.prefix,
    //-F     delimiter:  this.options.delimiter,
    //-F     separator:  this.options.separator,
    //-F     suffix:     this.options.suffix,
    //-F     precision:  this.options.precision
    //-F   });
    //-F } else {
    //-F   return value;
    //-F }
  }
});

