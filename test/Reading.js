var BufferQueueReader=require("../lib/BufferQueueReader").BufferQueueReader;
var BufferReader=require("../lib/BufferReader").BufferReader;
var Buffer=require("buffer").Buffer;
var vows=require("vows");
var assert=require("assert");

function createBufferQueueReader(start,end,len) {
	var q=new BufferQueueReader();
	while (start<end) {
		var b=new Buffer(len);
		for (var i=0; i<len; i++) {
			b[i]=start+i;
		}
		start+=len;
		q.push(b);
	}
	return q;
}
function createBufferReader(start,end) {
	var b=new Buffer(len);
	for (var i=0; i<len; i++) {
		b[i]=start+i;
	}
	start+=len;
	q.push(b);
	return new BufferReader(q);
}

function createArr(from,to,step) {
	var ret=[];
	for (; from<to; from+=step) {
		ret.push(from);
	}
	return ret;
}

function testSet(topic,matchingArray) {
	var suite={
		topic:topic
	};
	var primes=[3547,3557,3559,3571];
	//Single reads
	var singleReadTest=suite["single reading"]={
		topic: function(r) { return r}
	};
	function singleReadTestCallback(index,expected) {
		return function(q) {
			assert.equal(q.readByte(index),expected);
		}
	}
	for (var i=0; i<6; i++) {
		var read=(primes[0]+(primes[1] * i))%matchingArray.length;
		singleReadTest["byte "+read+" should return "+matchingArray[read]]=singleReadTestCallback(read,matchingArray[read]);
	}
	
	//Slices
	var sliceReadTest=suite["slice'ing"]={
		topic: function(r) { return r }
	};
	function generateSliceTest(start,end) {
		var test={
			topic: function(q) { return q.slice(start,end); },
		}
		var match=matchingArray.slice(start,end);
		test["be a Buffer"]=function(s) { assert.ok(Buffer.isBuffer(s)); };
		test[".length = "+match.length]=function(s) { assert.equal(s.length,match.length); };
		test["equal ["+match[0]+",...,"+match[match.length-1]+"]"]=function(s) {
			match.forEach(function(x,index) {
				assert.equal(s[index],x);
			});
		};
		return test;
	}
	for (var i=0; i<6; i++) {
		read=(primes[0]+(primes[2] * i))%matchingArray.length;
		var len=(primes[2]+(primes[1] * i))%(matchingArray.length-read);
		var end=read+len;
		sliceReadTest[read+" to "+end]=generateSliceTest(read,end);
	}
	
	//Reading multiple bytes
	var bytesReadTest=suite["reading"]={
		topic: function(r) {return r;}
	};
	function generateReadBytesTest(start,len) {
		var test={
			topic: function(q) { return q.readBytes(start,len); },
		}
		var match=matchingArray.slice(start,start+len);
		test["be an array"]=function(s) { assert.ok(Array.isArray(s)); };
		test[".length = "+match.length]=function(s) { assert.equal(s.length,match.length); };
		test["equal ["+match[0]+",...,"+match[match.length-1]+"]"]=function(s) {
			match.forEach(function(x,index) {
				assert.equal(s[index],x);
			});
		};
		return test;
	}
	for (var i=0; i<6; i++) {
		read=(primes[1]+(primes[3] * i))%matchingArray.length;
		len=(primes[3]+(primes[0] * i))%(matchingArray.length-read);
		bytesReadTest[len+" bytes from "+read]=generateReadBytesTest(read,len);
	}
	return suite;
}

function Skip(n,q) {
	q.skip(n);
	return q;
}

vows.describe("BufferQueue tests").addBatch({
	"(test-suite) createArr":{
		topic: function() { return createArr },
		"when asked to create from 0, to 5, step 1":{
			topic: function(c) { return c(0,5,1); },
			"returns an array":function(r) { assert.ok(Array.isArray(r)); },
			"of size 5":function(r) { assert.equal(5,r.length); },
			"[0] = 0":function(r) { assert.equal(0,r[0]); },
			"[1] = 1":function(r) { assert.equal(1,r[1]); },
			"[2] = 2":function(r) { assert.equal(2,r[2]); },
			"[3] = 3":function(r) { assert.equal(3,r[3]); },
			"[4] = 4":function(r) { assert.equal(4,r[4]); }
		},
		"when asked to create from 0, to 5, step 2":{
			topic: function(c) { return c(0,5,2); },
			"returns an array":function(r) { assert.ok(Array.isArray(r)); },
			"of size 3":function(r) { assert.equal(3,r.length); },
			"[0] = 0":function(r) { assert.equal(0,r[0]); },
			"[1] = 2":function(r) { assert.equal(2,r[1]); },
			"[2] = 4":function(r) { assert.equal(4,r[2]); }
		},
		
	}
}).addBatch({
	"(gen) On an array of 1-length buffers": testSet(createBufferQueueReader(0,100,1),createArr(0,100,1)),
	"(gen) On an array of 2-length buffers": testSet(createBufferQueueReader(0,100,2),createArr(0,100,1)),
	"(gen) On an array of 5-length buffers": testSet(createBufferQueueReader(0,100,5),createArr(0,100,1)),
	"(gen) On an array of 5-length buffers, popped 60": testSet(Skip(60,createBufferQueueReader(0,200,5)),createArr(60,200,1)),
	"(gen) On an array of 2-length buffers, popped 60": testSet(Skip(60,createBufferQueueReader(0,200,2)),createArr(60,200,1)),
	"(gen) On an array of 2-length buffers, popped 60+5": testSet(Skip(5,Skip(60,createBufferQueueReader(0,200,2))),createArr(65,200,1))
}).export(module);