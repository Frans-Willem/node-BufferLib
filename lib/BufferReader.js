function BufferReader(buffer) {
	this.buffer=buffer;
	this.offset=0;
	this.length=this.buffer.length;
}
exports.BufferReader=BufferReader;
BufferReader.prototype.skip=function(count) {
	if (this.length < count) {
		throw new Error("out of range");
	}
	this.length-=count;
	this.offset+=count;
}
BufferReader.prototype.popByte=function() {
	if (this.length<1) {
		throw new Error("out of range");
	}
	this.length--;
	return this.buffer[this.offset++];
}
BufferReader.prototype.popChar=function() {
	return String.fromCharCode(this.popByte());
}
BufferReader.prototype.popBytes=function(count) {
	if (this.length < count) {
		throw new Error("out of range");
	}
	var ret=[];
	while (count--) {
		ret.push(this.buffer[this.offset++]);
		this.length--;
	}
	return ret;
}
BufferReader.prototype.popBuffer=function(count) {
	if (count>this.length) {
		throw new Error("out of range");
	}
	var ret=this.buffer.slice(this.offset,this.offset+count);
	this.offset+=count;
	this.length-=count;
	return ret;
}
BufferReader.prototype.popString=function(count,encoding) {
	return this.popBuffer(count).toString(encoding || 'utf8');
}
BufferReader.prototype.popStringZero=function(encoding) {
	var indexZero=Array.prototype.indexOf.call(this.buffer,0,this.offset),oldoffset;
	if (indexZero===-1) {
		return undefined;
	}
	var ret=this.buffer.slice(this.offset,this.indexZero).toString(encoding || 'utf8');
	oldoffset=this.offset;
	this.offset=indexZero+1;
	this.length-=this.offset-oldoffset;
	return ret;
}
BufferReader.prototype.popIntLE=function(count) {
	if (this.length < count) {
		throw new Error("out of range");
	}
	var ret=0,
		shift=-8;
	while (count--) {
		ret=ret + ((this.buffer[this.offset++] << (shift+=8))>>>0);
		this.length--;
	}
	return ret;
}
BufferReader.prototype.popIntBE=function(count) {
	if (this.length < count) {
		throw new Error("out of range");
	}
	var ret=0;
	while (count--) {
		ret=((ret<<8)>>>0) + this.buffer[this.offset++];
		this.length--;
	}
	return ret;
}
BufferReader.prototype.indexOf=function(find,start) {
	return Array.prototype.indexOf.call(this.buffer,find,start);
}
BufferReader.prototype.readByte=function(offset) {
	if (offset>=this.length) {
		throw new Error("out of range");
	}
	return this.buffer[this.offset+offset];
}
BufferReader.prototype.readChar=function(offset) {
	return String.fromCharCode(this.readByte(offset));
}
BufferReader.prototype.readBytes=function(offset,count) {
	if (offset+count > this.length) {
		throw new Error("out of range");
	}
	return Array.prototype.slice.call(this.buffer,this.offset+offset,this.offset+offset+count);
}
BufferReader.prototype.readBuffer=function(offset,count) {
	if (offset+count > this.length) {
		throw new Error("out of range");
	}
	return this.buffer.slice(this.offset+offset,this.offset+offset+count);
}
BufferReader.prototype.readString=function(offset,count,encoding) {
	return this.readBuffer(offset,count).toString(encoding || 'utf8');
}
BufferReader.prototype.readStringZero=function(offset,encoding) {
	var indexZero=Array.prototype.indexOf.call(this.buffer,0,this.offset+offset);
	if (indexZero===-1) {
		return undefined;
	}
	return this.readString(offset,indexZero-offset,encoding);
}
BufferReader.prototype.readIntLE=function(offset,size) {
	if (offset+size < this.length) {
		throw new Error("out of range");
	}
	var ret=0,
		shift=-8;
	while (size--) {
		ret=ret + ((this.buffer[this.offset + offset++]<<(shift+=8))>>>0);
	}
	return ret;
}
BufferReader.prototype.readIntBE=function(offset,size) {
	if (offset+size < this.length) {
		throw new Error("out of range");
	}
	var ret=0;
	while (size--) {
		ret=((ret<<8)>>>0) + this.buffer[this.offset + offset++];
	}
	return ret;
}
BufferReader.prototype.copy=function(targetBuffer, targetStart, sourceStart, sourceEnd) {
	return this.buffer.copy(targetBuffer,targetStart,sourceStart,sourceEnd);
}
BufferReader.prototype.slice=function(start,end) {
	if (end<=start) {
		return new Buffer(0);
	}
	if (start<0 || end>this.length) {
		throw new Error("out of range");
	}
	return this.buffer.slice(start,end);
}