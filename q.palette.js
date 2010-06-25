/*
 * Q.Palette 0.1.1
 *
 * Copyright (c) 2010 Boys Abroad (Wout Fierens)
 *
 * Licensed under the MIT (http://opensource.org/licenses/mit-license.php) license.
 */

if(typeof Q=='undefined')
alert("Q is not loaded. Please make sure that your page includes q.js before it includes q.palette.js");Q.Palette=Class.create(Q.Base,{initialize:function($super,input,options){$super(input);if(typeof options=="string"&&options.isJSON())
options=options.evalJSON();this.options=$H(this.options).merge({round:true,maxRowSize:18,maxWidth:342,colorizeInput:true,swatchSize:19,swatchSpace:2,holderStyle:{position:'absolute'}}).merge(options).toObject();Q.addCssFor('palette');Q.register('palette');if(!this.input)
alert('Q.Palette Error: No input was defined to attach the Palette to!');else
this.build();},build:function(){var holder=this.createHolder('plain'),ulClass='q-palette-'+Q.counts.palette,shrunken=this.options.swatchSize-(this.options.swatchSpace*2),round=Math.ceil(this.options.swatchSize/2),maxWidth=this.options.maxRowSize?this.options.maxRowSize*this.options.swatchSize:this.options.maxWidth,value=this.value=this.input.value,valid=this.hexToRgb(value),ul;Q.addCss('#q_wrapper ul.q-palette.'+ulClass,'max-width:'+maxWidth+'px;');Q.addCss('#q_wrapper ul.q-palette.'+ulClass+' li.q-color','margin:'+this.options.swatchSpace+'px; width:'+shrunken+'px; height:'+shrunken+'px;');Q.addCss('#q_wrapper ul.q-palette.'+ulClass+' li.q-color:hover','margin:0px; width:'+this.options.swatchSize+'px; height:'+this.options.swatchSize+'px;');Q.addCss('#q_wrapper ul.q-palette.'+ulClass+' li.q-color.active','margin:0px; width:'+this.options.swatchSize+'px; height:'+this.options.swatchSize+'px;');Q.addCss('#q_wrapper ul.q-palette.'+ulClass+' li.q-color.round','-moz-border-radius:'+round+'px;-webkit-border-radius:'+round+'px;border-radius:'+round+'px;');ul=new Element('ul').addClassName('q-palette').addClassName(ulClass);this.colorList().each((function(color){var li=new Element('li').addClassName('q-color').setStyle({backgroundColor:color}).update('&nbsp;');if(this.options.round)
li.addClassName('round');if(value==color)
li.addClassName('active');li.onmouseover=(function(){Q.callback('onPick',this,color);}).bind(this);li.onclick=(function(){if(color!=this.value){Q.callback('onChange',this,color);li.up('ul.q-palette').select('li.active').invoke('removeClassName','active');li.addClassName('active');this.input.value=this.value=color;this.colorizeInput(color);}}).bind(this);ul.insert(li);}).bind(this));ul.insert(new Element('li').addClassName('q-clearer').update('&nbsp;'));if(valid)
this.colorizeInput(this.rgbToHex(valid));holder.down("div.q-center").insert(ul);},colorList:function(){if(this.options.colors){return this.options.colors;}else{var colors=[];$w('00 33 66 99 cc ff').each(function(part_1){$w('00 33 66 99 cc ff').each(function(part_2){$w('00 33 66 99 cc ff').each(function(part_3){colors.push('#'+part_1+part_2+part_3);});});});return colors;}},colorizeInput:function(color){if(this.options.colorizeInput)
this.input.setStyle({backgroundColor:color,color:this.getTextColor(color)});return this;},getTextColor:function(hex){var rgb=this.hexToRgb(hex),brt=(rgb.r/255*0.30)+(rgb.g/255*0.59)+(rgb.b/255*0.11);if(brt<0.5){var m=Math.floor(brt*20)+3;var im=255*(m-1);}else{var m=Math.floor((1.0-brt)*20)+3;var im=0;}
return this.rgbToHex({r:Math.floor((rgb.r+im)/m),g:Math.floor((rgb.g+im)/m),b:Math.floor((rgb.b+im)/m)});},hexToRgb:function(hex){var m;if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{0,2})(?:[^0-9A-Fa-f]|$)/.exec(hex))
return{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)};if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f])(?:[^0-9A-Fa-f]|$)/.exec(hex)){var b=parseInt(m[3],16);return{r:parseInt(m[1],16),g:parseInt(m[2],16),b:b*16+b};}
if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})(?:[^0-9A-Fa-f]|$)/.exec(hex)){var g=parseInt(m[2],16);return{r:parseInt(m[1],16),g:g,b:g};}
if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f]{0,2})(?:[^0-9A-Fa-f]|$)/.exec(hex)){var r=parseInt(m[1],16);var g=parseInt(m[2],16);var b=parseInt(m[3],16);return{r:r*16+r,g:g*16+g,b:b*16+b};}
if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f]{2})(?:[^0-9A-Fa-f]|$)/.exec(hex)){var g=parseInt(m[1],16);return{r:g,g:g,b:g};}
if(m=/^[^0-9A-Fa-f]*([0-9A-Fa-f])(?:[^0-9A-Fa-f]|$)/.exec(hex)){var g=parseInt(m[1],16);g=g*16+g;return{r:g,g:g,b:g};}
return false;},rgbToHex:function(rgb){return"#"+rgb.r.toColorPart()+rgb.g.toColorPart()+rgb.b.toColorPart();}});