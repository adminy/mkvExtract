let exec = require('child_process').exec,
	fs = require('fs'),
	languages = require("./languages.json"),
    tracks = []

if(process.argv.length !== 3) {
	console.log("Usage: node extract file.mkv")
	process.exit()
}

exec("mkvinfo " + process.argv[2], function(error, stdout, stderr){  

let lines = stdout.split("\n")
	let processingTrack = 0, // 0 - initial state, 1 - found track header, 2 - processing
	track = {}
	for(let i = 0; i < lines.length;i++) {
		
		//is track at beggining?
		let trackStart = lines[i].indexOf("| + Track") !== -1

		//save already processed tracks (if any) and clean track for new ones
		if(processingTrack == 2 && trackStart) {
			tracks.push(track)
			track = {}
			processingTrack = 1
		}
		
		//#1st track you process would not have a predecessor, so this is the case for that
		if(trackStart)
			processingTrack = 1

		//Finished with track information, stop
		if(processingTrack == 2 && lines[i].substring(0,2) == "|+") {
			tracks.push(track)
			break
		}

		//upgrade to track processing after track header is no longer in the loop
		if(processingTrack == 1 && !trackStart )
			processingTrack = 2

		//Handling "non-track info" with a "continue"
		if(processingTrack == 0)
			continue

		//reading Track information
		if(processingTrack == 2 && lines[i].substring(0, 5) == "|  + ") {
			let data_info = lines[i].substring(5)
			
			if( data_info.indexOf("Track number:") !== -1 )
				track.id = data_info.substring(13).split(":")[1].split(")")[0].substring(1)
			
			else if( data_info.indexOf("Track type:") !== -1 )
				track.type = data_info.substring(12).split()[0]
			
			else if( data_info.indexOf("Codec ID:") !== -1 )
				track.codec = data_info.substring(10).split()[0]

			else if( data_info.indexOf("Name:") !== -1 )
				track.name = data_info.substring(6).split()[0]

			else if( data_info.indexOf("Language:") !== -1 && track.type !== "video" && data_info.substring(10).split()[0] != "und" )
				 track.language = data_info.substring(10).split()[0]
			
			//bonus, if track name mentions language in it ...
			if( track.name && !track.language )
				for(let i = 0; i < languages.length; i++)
					if(track.name.indexOf(languages[i][1]) !== -1)
						track.language = languages[i][0]

		}
		
		//video resolution information (part of the track)
		if(processingTrack == 2 && lines[i].substring(0, 6) == "|   + ") {
			let data_info = lines[i].substring(6)

			if( data_info.indexOf("Pixel width:") !== -1 )
				track.width = data_info.substring(13)	//you can wrap this in a parseInt ... but not neccesary
				
			else if( data_info.indexOf("Pixel height:") !== -1 )
				track.height = data_info.substring(14)	//and this
			
			else if( data_info.indexOf("Display width:") !== -1 )
				track.width = data_info.substring(15)	//and this
				
			else if( data_info.indexOf("Display height:") !== -1 )
				track.height = data_info.substring(16)	//and this


			
		}
		// console.log(lines[i])
		
	}
	// console.log(tracks)

	//Finished getting tracks information, now onto extracting the necessary ones
	let saveFolder = process.argv[2].split(".mkv")[0]
	if (!fs.existsSync(__dirname + "/" + saveFolder))
		fs.mkdirSync(__dirname + "/" + saveFolder, 0777)

	let extract_tracks_cmd = "mkvextract tracks " + process.argv[2] + " "

	for(let i = 0; i < tracks.length; i++) {
		let track = tracks[i],
			track_str = track.id + ":" + saveFolder + "/" + track.type + track.id + "_"

		if(track.language)
			track_str += track.language + "_"

		else if(!track.language && track.type !== "video")
			track_str += "und_"	//for the bonus :)


		if(track.type == "video")
			track_str += track.width + "x" + track.height + "_"

		if(track.name)
			track_str += track.name + "_"

		//codec file format
		track_str = track_str.substring(0, track_str.length - 1) + "."

		if(track.codec.toLowerCase().indexOf("hevc") !== -1)
			track_str += "h265"
		
		else if(track.codec.toLowerCase().indexOf("ass") !== -1)
			track_str += "ass"
	
		else if(track.codec.toLowerCase().indexOf("aac") !== -1)
			track_str += "aac"

		else if(track.codec.toLowerCase().indexOf("flac") !== -1)
			track_str += "flac"

		else if(track.codec.toLowerCase().indexOf("vorbis") !== -1)
			track_str += "oog"
		else
			track_str = "" //track_str += track.codec	//._. I don't care about other formats ... do you? then here: https://matroska.org/technical/specs/codecid/index.html

		//append track to command & continue
		extract_tracks_cmd += track_str + " "
	}
	extract_tracks_cmd = extract_tracks_cmd.replace(/\\/g, "\\\\").replace(/\$/g, "\\$").replace(/'/g, "\\'").replace(/"/g, "\\\"")
										   .replace(/\(/g, "\\\(").replace(/\)/g, "\\\)")

	// console.log(extract_tracks_cmd)
	exec(extract_tracks_cmd, function(error, stdout, stderr) {  
		console.log("Extracted!")

		var files = fs.readdirSync(__dirname + "/" + saveFolder).filter(fn => fn.endsWith('.ass'))
		files.forEach(function(file) {
			let filePath = __dirname + "/" + saveFolder + "/" + file

			fs.readFile(filePath, 'utf8', function(err, script) {
				for(let i = 0; i < languages.length; i++)
					if(script.indexOf(languages[i][1]) !== -1) {
						exec("mv " + filePath + " " + filePath.replace("_und_", "_"+languages[i][0]+"_"))
						break; //Not the best of choices ... but No NN's for language credibility ...
					}
			})
			
		})
		// console.log(files)
		//Try bonus once again ... hope ...
	})
})
