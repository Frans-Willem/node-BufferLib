function BufferQueueReader() {
	this.buffers=[];
	this.offset=0;
	this.length=0;
}
exports.BufferQueueReader=BufferQueueReader;
BufferQueueReader.prototype.push=function(b) {
	if (b.length<1) {
		return;
	}
	this.length+=b;
	this.buffers.push(b);
	return this;
}
BufferQueueReader.prototype.skip=function(count) {
	if (count>this.length) {
		throw new Error("out of range");
	}
	var b;
	this.offset+=count;
	this.length-=count;
	while (this.buffers.length && (b=this.buffers[0]).length<=this.offset) {
		this.buffers.shift();
		this.offset-=b.length;
	}
}
BufferQueueReader.prototype.popByte=function() {
	if (this.length<1) {
		throw new Error("out of range");
	}
	var ret,b;
	ret=(b=this.buffers[0])[this.offset++];
	this.length--;
	if (this.offset>=b.length) {
		this.buffers.shift();
		this.offset-=b.length;
	}
	return ret;
}
BufferQueueReader.prototype.popChar=function() {
	return String.fromCharCode(this.popByte());
}
BufferQueueReader.prototype.popBytes=function(count) {
	if (count>this.length) {
		throw new Error("out of range");
	}
	this.length-=count;
	var ret=[],b;
	while (count--) {
		ret.push((b=this.buffers)[0][this.offset++]);
		if (this.offset>=b.length) {
			this.buffers.shift();
			this.offset-=b.length;
		}
	}
}
BufferQueueReader.prototype.popBuffer=function(count) {
	if (count<1) {
		return new Buffer(0);
	}
	if (count>this.length) {
		throw new Error("out of range");
	}
	var b,ret,offset,written;
	this.length-=count;
	if (this.offset + count <= (b=this.buffers[0]).length) {
		ret=b.slice(this.offset,this.offset+count);
		this.offset+=count;
		if (this.offset>=b.length) {
			this.offset-=b.length;
			this.buffers.shift();
		}
	} else {
		ret=new Buffer(count);
		while (count) {
			this.offset+=(written=b.copy(ret,offset,this.offset,Math.max(this.offset+count,b.length)));
			count-=written;
			offset+=written;
			if (this.offset>=b.length) {
				this.offset-=b.length;
				this.buffers.shift();
				b=this.buffers[0];
			}
		}
	}
	return ret;
}
BufferQueueReader.prototype.popString=function(count,encoding) {
	return this.popBuffer(count).toString(encoding || 'utf8');
}
BufferQueueReader.prototype.popStringZero=function(encoding) {
	var offsetZero=this.indexOf(0),
		ret;
	if (offsetZero===-1)
		return undefined;
	ret=this.popString(offsetZero,encoding);
	this.skip(1);
	return ret;
}
BufferQueueReader.prototype.popIntLE=function(size) {
	if (size>this.length) {
		throw new Error("out of range");
	}
	var ret=0,
		shift=-8,
		b;
	this.length-=size;
	while (size--) {
		ret=ret + (((b=this.buffers[0])[this.offset++] << (shift+=8))>>>0);
		if (this.offset >= b.length) {
			this.offset-=this.buffers.shift().length;
		}
	}
	return ret;
}
BufferQueueReader.prototype.popIntBE=function(size) {
	if (size>this.length) {
		throw new Error("out of range");
	}
	var ret=0,
		b;
	this.length-=size;
	while (size--) {
		ret=((ret<<8)>>>0) + (b=this.buffers[0])[this.offset++];
		if (this.offset >= b.length) {
			this.offset-=this.buffers.shift().length;
		}
	}
	return ret;
}
BufferQueueReader.prototype.indexOf=function(find,start) {
	var offset=this.offset+(start || 0),
		index=0,
		totalOffset=0,
		b=this.buffers[index];
	while (index<this.buffers.length && offset>=b.length) {
		offset-=b.length;
		b=this.buffers[++index];
	}
	while (index<this.buffers.length) {
		if (b[offset]===find)
			return totalOffset;
		offset++;
		totalOffset++;
		if (offset>=b.length) {
			offset=0;
			b=this.buffers[++index];
		}
	}
	return -1;
}
BufferQueueReader.prototype.readByte=function(offset) {
	if (offset>=this.length) {
		throw new Error("out of range");
	}
	var index=0,
		b;
	offset+=this.offset;
	while ((b=this.buffers[index]).length <= offset) {
		index++;
		offset-=b.length;
	}
	return b[offset];
}
BufferQueueReader.prototype.readChar=function(offset) {
	return String.fromCharCode(this.readByte(offset));
}
BufferQueueReader.prototype.readBytes=function(offset,count) {
	if (offset+count>this.length) {
		throw new Error("out of range");
	}
	var offset=this.offset+offset,
		index=0,
		b;
	while ((b=this.buffers[index]).length <= offset) {
		index++;
		offset-=b.length;
	}
	var ret=[];
	while (count--) {
		ret.push(b[offset++]);
		if (offset>=b.length) {
			offset=0;
			b=this.buffers[++index];
		}
	}
	return ret;
}
BufferQueueReader.prototype.readBuffer=function(offset,count) {
	if (offset+count>this.length) {
		throw new Error("out of range");
	}
	var index=0,
		b,
		ret,
		retOffset,
		written;
	offset+=this.offset;
	while ((b=this.buffers[index]).length <= offset) {
		index++;
		offset-=b.length;
	}
	if (b.length >= offset+count) {
		return b.slice(offset,offset+count);
	} else {
		ret=new Buffer(count);
		retOffset=0;
		while (count) {
			retOffset+=(written=b.copy(ret,retOffset,offset,Math.min(b.length,offset+count)));
			count-=written;
			offset+=written;
			if (offset>=b.length) {
				offset=0;
				b=this.buffers[++index];
			}
		}
		return ret;
	}
}
BufferQueueReader.prototype.readString=function(offset,count,encoding) {
	return this.readBuffer(offset,count).toString(encoding || 'utf8');
}
BufferQueueReader.prototype.readStringZero=function(offset,encoding) {
	var offsetZero=this.indexOf(0,offset);
	if (offsetZero===-1)
		return undefined;
	return this.readString(offset,offsetZero-offset,encoding);
}
BufferQueueReader.prototype.readIntLE=function(offset,size) {
	if (offset+size>this.length) {
		throw new Error("out of range");
	}
	var index=0,
		b;
	while (offset>=(b=this.buffers[index]).length) {
		index++;
		offset-=b.length;
	}
	var ret=0,
		shift=-8;
	while (size--) {
		ret=ret+((b[offset++]<<(shift+=8))>>>0);
		if (offset>=b.length) {
			offset=0;
			b=this.buffers[++index];
		}
	}
	return ret;
}
BufferQueueReader.prototype.readIntBE=function(offset,size) {
	if (offset+size>this.length) {
		throw new Error("out of range");
	}
	var index=0,
		b;
	while (offset>=(b=this.buffers[index]).length) {
		index++;
		offset-=b.length;
	}
	var ret=0;
	while (size--) {
		ret=((ret<<8)>>>0)+b[offset++];
		if (offset>=b.length) {
			offset=0;
			b=this.buffers[++index];
		}
	}
	return ret;
}
BufferQueueReader.prototype.copy=function(targetBuffer, targetStart, sourceStart, sourceEnd) {
	if (souceStart<0 || sourceEnd>this.length) {
		throw new Error("out of range");
	}
	var offset=this.offset+sourceStart,
		count=sourceEnd-sourceStart,
		index=0,
		b,
		written,
		totalWritten=0;
	while ((b=this.buffers[index]).length <= offset) {
		index++;
		offset-=b.length;
	}
	if (b.length >= offset+count) {
		return b.copy(offset,offset+count);
	} else {
		while (count) {
			targetStart+=(written=b.copy(targetBuffer,targetStart,offset,Math.min(b.length,offset+count)));
			count-=written;
			offset+=written;
			totalWritten+=written;
			if (offset>=b.length) {
				offset=0;
				b=this.buffers[++index];
			}
		}
		return totalWritten;
	}
}
BufferQueueReader.prototype.slice=function(start,end) {
	if (end<=start) {
		return new Buffer(0);
	}
	if (start<0 || end>this.length) {
		throw new Error("out of range");
	}
	return this.readBuffer(start,end-start);
}