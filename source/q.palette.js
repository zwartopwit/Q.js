/*
 * Q.Palette 0.1.1
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if (typeof Q == 'undefined')
  alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.palette.js");

Q.Palette = Class.create(Q.Base, {
  initialize: function($super, input, options) {
    $super(input);
    
    if (typeof options == "string" && options.isJSON())
      options = options.evalJSON();
    
    // merge user options, Q.Slider options and Q default options
    this.options = $H(this.options).merge({
      round:          true,
      maxRowSize:     18,
      maxWidth:       342,
      colorizeInput:  true,
      swatchSize:     19,
      swatchSpace:    2,
      
      // the style for the wrapper
      holderStyle: {
        position: 'absolute' }
      
    }).merge(options).toObject();
    
    // add css for this plugin
    Q.addCssFor('palette');
    
    // register subclass
    Q.register('palette');
    
    // attach slider to a given field or else to any field with a given or the default class
    if (!this.input)
      alert('Q.Palette Error: No input was defined to attach the Palette to!');
    else
      this.build();
  },
  
  // customized control for this subclass
  build: function() {
    var holder      = this.createHolder('plain'),
        ulClass     = 'q-palette-' + Q.counts.palette,
        shrunken    = this.options.swatchSize - (this.options.swatchSpace * 2),
        round       = Math.ceil(this.options.swatchSize / 2),
        maxWidth    = this.options.maxRowSize ? this.options.maxRowSize * this.options.swatchSize : this.options.maxWidth,
        value       = this.value = this.input.value,
        valid       = this.hexToRgb(value),
        ul;
    
    // add custom css declarations
    Q.addCss(
      '#q_wrapper ul.q-palette.' + ulClass,
      'max-width:' + maxWidth + 'px;');
    Q.addCss(
      '#q_wrapper ul.q-palette.' + ulClass + ' li.q-color',
      'margin:' + this.options.swatchSpace + 'px; width:' + shrunken + 'px; height:' + shrunken + 'px;');
    Q.addCss(
      '#q_wrapper ul.q-palette.' + ulClass + ' li.q-color:hover',
      'margin:0px; width:' + this.options.swatchSize + 'px; height:' + this.options.swatchSize + 'px;');
    Q.addCss(
      '#q_wrapper ul.q-palette.' + ulClass + ' li.q-color.active',
      'margin:0px; width:' + this.options.swatchSize + 'px; height:' + this.options.swatchSize + 'px;');
    Q.addCss(
      '#q_wrapper ul.q-palette.' + ulClass + ' li.q-color.round',
      '-moz-border-radius:' + round + 'px;-webkit-border-radius:' + round + 'px;border-radius:' + round + 'px;');
    
    // list element
    ul = new Element('ul').
      addClassName('q-palette').
      addClassName(ulClass);
    
    // create the colorlist
    this.
      colorList().
      each((function(color) {
        var li = new Element('li').
          addClassName('q-color').
          setStyle({ backgroundColor: color }).
          update('&nbsp;');
        
        // if corners should be rounded
        if (this.options.round)
          li.addClassName('round');
        
        // add active class if == input value
        if (value == color)
          li.addClassName('active');
        
        // add behavior
        li.onmouseover = (function() {
          Q.callback('onPick', this, color);
        }).bind(this);
        
        li.onclick = (function() {
          if (color != this.value) {
            
            Q.callback('onChange', this, color);
            
            // deactivate active spots
            li.
              up('ul.q-palette').
              select('li.active').
              invoke('removeClassName', 'active');

            // activate the new one
            li.
              addClassName('active');

            this.input.value = this.value = color;

            this.colorizeInput(color);
          }
        }).bind(this);
        
        ul.
          insert(li);
      }).bind(this));
    
    // add a clearer to close the floating list
    ul.
      insert(
        new Element('li').
          addClassName('q-clearer').
          update('&nbsp;')
      );
    
    // set the input's value if it is valid
    if (valid)
      this.
        colorizeInput(
          this.
            rgbToHex(valid)
        );
    
    // insert the colorlist
    holder.
      down("div.q-center").
      insert(ul);
  },
  
  // return the provided colorlist or build one
  colorList: function() {
    if (this.options.colors) {
      return this.options.colors;
    } else {
      var colors = [];
      
      $w('00 33 66 99 cc ff').each(function(part_1) {
        $w('00 33 66 99 cc ff').each(function(part_2) {
          $w('00 33 66 99 cc ff').each(function(part_3) {
            colors.push('#' + part_1 + part_2 + part_3);
          });
        });
      });
      
      return colors;
    }
  },
  
  // set the background and text color of the input
  colorizeInput: function(color) {
    if (this.options.colorizeInput)
      this.
        input.
        setStyle({
          backgroundColor: color,
          color: this.getTextColor(color)
        });
    
    return this;
  },
  
  // return a contrasting text according to the true brightness of a given color
  getTextColor: function(hex) {
    var rgb = this.hexToRgb(hex),
        brt = (rgb.r / 255 * 0.30) + (rgb.g / 255 * 0.59) + (rgb.b / 255 * 0.11);
    if (brt < 0.5) {
      var m = Math.floor(brt * 20) + 3;
      var im = 255 * (m - 1);
    } else {
      var m = Math.floor((1.0 - brt) * 20) + 3;
      var im = 0;
    }
    return this.rgbToHex({
      r: Math.floor((rgb.r + im) / m),
      g: Math.floor((rgb.g + im) / m),
      b: Math.floor((rgb.b + im) / m)
    });
  },
  
  // convert hex string to rgb object
  hexToRgb: function(hex) {
    var m;
    // Six-to-eight hex values.  Treat as RRGGBB, RRGGBBA, or RRGGBBAA
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{0,2})(?:[^0-9A-Fa-f]|$)/.exec(hex))
      return { r:parseInt(m[1], 16), g:parseInt(m[2], 16), b:parseInt(m[3],16) };
      
    // Five hex values.  Treat as RRGGB
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f])(?:[^0-9A-Fa-f]|$)/.exec(hex)) {
      var b = parseInt(m[3], 16);
      return { r:parseInt(m[1], 16), g:parseInt(m[2], 16), b:b*16+b };
    }
    
    // Four hex values.  Treat as RRGG, B=G
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})(?:[^0-9A-Fa-f]|$)/.exec(hex)) {
      var g = parseInt(m[2], 16);
      return { r:parseInt(m[1], 16), g:g, b:g };
    }
    
    // Three hex values.  Treat as RGB
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f]{0,2})(?:[^0-9A-Fa-f]|$)/.exec(hex)) {
      var r = parseInt(m[1], 16);
      var g = parseInt(m[2], 16);
      var b = parseInt(m[3], 16);
      return { r:r*16+r, g:g*16+g, b:b*16+b };
    }
    
    // Two hex values.  Treat as 8-bit grayscale
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})(?:[^0-9A-Fa-f]|$)/.exec(hex)) {
      var g = parseInt(m[1], 16);
      return { r:g, g:g, b:g };
    }

    // One hex value.  Treat as 4-bit grayscale
    if (m = /^[^0-9A-Fa-f]*([0-9A-Fa-f])(?:[^0-9A-Fa-f]|$)/.exec(hex)) {
      var g = parseInt(m[1], 16);
      g = g * 16 + g;
      return { r:g, g:g, b:g };
    }
    // if none matched, return false
    return false;
  },
  
  // convert a rgb object to hex
  rgbToHex: function(rgb) {
    return "#" + rgb.r.toColorPart() + rgb.g.toColorPart() + rgb.b.toColorPart();
  }
});

