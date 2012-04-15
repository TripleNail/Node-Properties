"use strict";var FS=require("fs"),PATH=require("path"),BufferedReader=require("buffered-reader").BufferedReader,BUFFER_SIZE=4096,SLASH=PATH.normalize("/"),EOL=process.platform.indexOf("win")!==-1?"\r\n":"\n",charFromUnicodeString=function(a){var b=0,c;for(var d=0;d<4;d++){c=a[d];switch(c){case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":b=(b<<4)+c.charCodeAt(0)-48;break;case"a":case"b":case"c":case"d":case"e":case"f":b=(b<<4)+c.charCodeAt(0)-88;break;case"A":case"B":case"C":case"D":case"E":case"F":b=(b<<4)+c.charCodeAt(0)-55}}return String.fromCharCode(b)},unicodeStringFromChar=function(a){var b=a.charCodeAt(0);return"\\u"+toHex(b>>12)+toHex(b>>8)+toHex(b>>4)+toHex(b)},toHex=function(a){var b="0123456789ABCDEF";return b[a&15]},PropertyReader=function(a,b){this._onLine=a,this._onEOF=b,this._skipWhiteSpace=!0,this._isCommentLine=!1,this._isNewLine=!0,this._appendedLineBegin=!1,this._precedingBackslash=!1,this._skipLF=!1,this._line=""};PropertyReader.prototype._convert=function(a,b,c){var d,e="",f;while(a<b)d=c[a++],d==="\\"?(d=c[a++],d==="u"?e+=charFromUnicodeString(c[a++]+c[a++]+c[a++]+c[a++]):(d==="t"?d="	":d==="r"?d="\r":d==="n"?d="\n":d==="f"&&(d="\f"),e+=d)):e+=d;return e},PropertyReader.prototype._readKeyValue=function(a){var b=!1,c=!1,d=a.length,e=d,f=0,g;while(f<d){g=a[f];if((g==="="||g===":")&&!c){e=f+1,b=!0;break}if((g===" "||g==="	"||g=="\f")&&!c){e=f+1;break}g==="\\"?c=!c:c=!1,f++}while(e<d){g=a[e];if(g!==" "&&g!=="	"&&g!=="\f"){if(!!b||g!=="="&&g!==":")break;b=!0}e++}this._onLine(this._convert(0,f,a),this._convert(e,d,a))},PropertyReader.prototype.eof=function(){this._line&&this._readKeyValue(this._line),this._onEOF()},PropertyReader.prototype.parse=function(a){if(this._isCommentLine){if(a==="\r"||a==="\n")this._isCommentLine=!1,this._isNewLine=!0,this._skipWhiteSpace=!0;return}if(this._skipLF){this._skipLF=!1;if(a==="\n")return}if(this._skipWhiteSpace){if(a===" "||a==="	"||a==="\f")return;if(!this._appendedLineBegin&&(a==="\r"||a==="\n"))return;this._skipWhiteSpace=!1,this._appendedLineBegin=!1}if(this._isNewLine){this._isNewLine=!1;if(a==="#"||a==="!"){this._isCommentLine=!0;return}}a!=="\n"&&a!=="\r"?(this._line+=a,a==="\\"?this._precedingBackslash=!this._precedingBackslash:this._precedingBackslash=!1):this._precedingBackslash?(this._line=this._line.substring(0,this._line.length-1),this._skipWhiteSpace=!0,this._appendedLineBegin=!0,this._precedingBackslash=!1,a==="\r"&&(this._skipLF=!0)):(this._isNewLine=!0,this._skipWhiteSpace=!0,this._line&&this._readKeyValue(this._line),this._line="")};var getFileName=function(a){var b=process.mainModule.filename,c=b.substring(0,b.lastIndexOf(SLASH)),d=PATH.relative(process.cwd(),c);return PATH.join(d,a)},Properties=function(){this._keys={}};Properties.SEPARATOR="=",Properties.COMMENT="#",Properties.prototype.get=function(a,b){var c=this._keys[a];return c!==undefined?c.value:b},Properties.prototype.keys=function(){return Object.keys(this._keys)},Properties.prototype.load=function(a,b){var c=this,d=new PropertyReader(function(a,b){c._keys[a]={value:b}},function(){b(null,!0)});(new BufferedReader(a,BUFFER_SIZE,"utf8")).on("error",function(a){b&&b(a,!1)}).on("character",function(a){d.parse(a)}).on("end",function(){d.eof()}).read()},Properties.prototype.set=function(a,b,c){return this._keys[a]={value:b?b.toString():b,comment:c},this};var convert=function(a,b,c){var d,e,f="";if(!a)return f;for(var g=0,h=a.length;g<h;g++){d=a[g],e=d.charCodeAt(0);if(e>61&&e<127){d==="\\"?(f+="\\",f+="\\"):f+=d;continue}switch(d){case" ":if(g===0||b)f+="\\";f+=" ";break;case"	":f+="\\",f+="t";break;case"\n":f+="\\",f+="n";break;case"\r":f+="\\",f+="r";break;case"\f":f+="\\",f+="f";break;case"=":case":":case"#":case"!":f+="\\",f+=d;break;default:e<33||e>126?f+=c?unicodeStringFromChar(d):d:f+=d}}return f};Properties.prototype.store=function(a,b,c,d){var e=arguments.length,f,g;e===2?(f=typeof b,f==="function"?(d=b,b=!1,c=null):f==="string"&&(c=b,b=!1)):e===3&&(f=typeof b,g=typeof c,f==="boolean"&&g==="function"?(d=c,c=null):f==="string"&&(d=c,c=b,b=!1));var h=FS.createWriteStream(getFileName(a));h.on("close",function(){d&&d(null,!0)}),h.on("error",function(a){d&&d(a,!1)}),c&&h.write(Properties.COMMENT+c+EOL);var i;for(var j in this._keys)i=this._keys[j],i.comment&&h.write(Properties.COMMENT+i.comment+EOL),h.write(convert(j,!0,b)+Properties.SEPARATOR+convert(i.value,!1,b)+EOL);h.end()},module.exports.Properties=Properties;