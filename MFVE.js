const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const colors = require('colors');

const spacer = '///////////////////////////////////////////////////////////';

let lastJobCount = 0;
let jobCount = 0;
const jobLimit = 1;

class mfve {
	constructor (sourceFile, outputPath, formats) {
		this.sourceFile = sourceFile;
		this.outputPath = outputPath;
		
		this.formats = (formats == undefined) ? [{}] : formats;
		this.formatCount = Object.keys(this.formats).length;
		
		this.formatsComplete = 0;
		
		console.log(colors.green('MFVE job created with ' + this.formatCount + " formats."));
	}
	
	async sbvc (sourceFile, outputPath, format, appendResolution = false) {
		// Determine actual format information for current cycle.
		const btrExtAvail = format.extension != undefined;
		const btrResAvail = format.resolution != undefined;
		const btrVbrAvail = format.videoBitrate != undefined;
		const btrAbrAvail = format.audioBitrate != undefined;
		const btrChnAvail = format.audioChannels != undefined;
			
		const extension = ((btrExtAvail ) ? format.extension : 'webm');
		const resolution = ((btrResAvail ) ? format.resolution : '1920x1080');
		const videoBitrate = ((btrVbrAvail ) ? format.videoBitrate : '1024k');
		const audioBitrate = ((btrAbrAvail ) ? format.audioBitrate : '320k');
		const audioChannels = ((btrChnAvail ) ? format.audioChannels : 2);
		
		console.log(`\n${spacer}\n Format data for file ${sourceFile}: \n${spacer}\n` + colors.yellow(`
		Resolution: ${resolution}
		Video Bitrate: ${videoBitrate}
		Audio Birtate: ${audioBitrate}
		Audio Channels: ${audioChannels}
		
		Output File Extension: ${extension}`) + `\n\n${spacer}\n`);
			
			
		// Begin conversion.
		const realOutputPath = (appendResolution) ? `${outputPath}-${resolution}.${extension}` : (outputPath + '.' + extension); 
		
		let job = await ffmpeg(sourceFile)
			.size(resolution)
			.videoBitrate(videoBitrate)
			.audioBitrate(audioBitrate)
			.audioChannels(audioChannels)
			.output(realOutputPath)
			
			.on('end', () => {
				console.log('conversion complete!');
				if(jobCount > 0) jobCount--;
			})
			.run();
	}
	
	progressConversion(jobTracker) {
		
		if(lastJobCount > jobCount) {
			this.formatsComplete++;
			lastJobCount = jobCount;
		}
		
		let format = this.formats[this.formatsComplete];
		
		jobCount++;
		lastJobCount++;
		
		let appendResolution = (this.formatsComplete > 0);
		if(format != undefined)
		{
			this.sbvc(this.sourceFile, this.outputPath, format, appendResolution);
		} else {
			console.log(colors.green('MFVE Job complete, terminating...'));
			clearInterval(jobTracker);
		}
	}
	
	run() {
		let jobTracker = setInterval(() => {
			if(jobCount < jobLimit) {
				this.progressConversion(jobTracker);
			} else {
				console.log('waiting for open job slot...');
			}
		}, 5000);
	}
}

// Just some test code to show it works.
let test = new mfve('sample.mp4', 'sample', [{extension: 'webm', resolution:'800x480'}, {extension: 'flv', resolution:'800x480'}]);
test.run();
