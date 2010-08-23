function BufferBuilder() {
	this.length=0;
	this.data=[];
}
exports.BufferBuilder=BufferBuilder;
BufferBuilder.prototype.pushByte=function(number) {
	this.length++;
	this.data.push(function(out,offset) {
		out[offset]=number;
		return 1;
	});
	return this;
}
BufferBuilder.prototype.pushChar=function(chr) {
	this.length++;
	this.data.push(function(out,offset) {
		out[offset]=chr.charCodeAt(0);
		return 1;
	});
	return this;
}
BufferBuilder.prototype.pushBytes=function(arr) {
	this.length+=arr.length;
	this.data.push(function(out,offset) {
		if (arr.every(function(v) { return v<0x80; })) {
			//Will only call into node one time
			return out.write(offset,String.fromCharCode.apply(String,arr),"ascii");
		} else {
			arr.forEach(function(v,i) {
				out[offset+i]=v;
			});
			return arr.length;
		}
	});
	return this;
}
BufferBuilder.prototype.pushBuffer=function(b) {
	this.length+=b.length;
	this.data.push(function(out,offset) {
		return b.copy(out,offset,0,b.length);
	});
	return this;
}
BufferBuilder.prototype.pushString=function(str,encoding) {
	encoding=encoding || 'utf8';
	var len=Buffer.byteLength(str,encoding);
	this.length+=len;
	this.data.push(function(out,offset) {
		return out.write(str,offset,encoding);
	});
	return this;
}
BufferBuilder.prototype.pushStringZero=function(str,encoding) {
	return this.pushString(str,encoding).pushByte(0);
}
BufferBuilder.prototype.pushIntLE=function(value,size) {
	//Little endian encodes:
	//  0x12345678
	//  0x78 0x56 0x34 0x12
	this.length+=size;
	this.data.push(function(out,offset) {
		var i,shift=-8;
		for (i=0; i<size; i++) {
			out[offset+i]=(value >>> (shift+=8)) & 0xFF;
		}
		return size;
	});
	return this;
}
BufferBuilder.prototype.pushIntBE=function(value,size) {
	//Little endian encodes:
	//  0x12345678
	//  0x12 0x34 0x56 0x78
	this.length+=size;
	this.data.push(function(out,offset) {
		var i,shift=size*8;
		for (i=0; i<size; i++) {
			out[offset+i]=(value >>> (shift-=8)) & 0xFF;
		}
		return size;
	});
	return this;
}
BufferBuilder.prototype.pushBuilder=function(builder) {
	this.data.push.apply(this.data,builder.data);
	this.length+=builder.length;
	return this;
}
BufferBuilder.prototype.toBuffer=function() {
	var b=new Buffer(this.length);
	this.copy(b,0,0,this.length);
	return b;
}
BufferBuilder.prototype.copy=function(targetBuffer, targetStart, sourceStart, sourceEnd) {
	sourceEnd=(sourceEnd === undefined)?this.length:sourceEnd;
	if (sourceEnd<this.length || sourceStart!==0) {
		throw new Error("partial copy not supported");
	}
	return this.data.reduce(function(offset,item) {
		return offset+item(targetBuffer,offset);
	},targetStart);
}