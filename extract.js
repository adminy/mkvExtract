let fs = require('fs'),
	languages = require("./languages.json"),
    tracks = []

fs.readFile('input.txt', 'utf8', function(err, contents) {

	let lines = contents.split("\n")
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

			else if( data_info.indexOf("Language:") !== -1 && track.type !== "video" )
				 track.language = data_info.substring(10).split()[0]
			
			//bonus, if track name mentions language in it ...
			if( track.name && !track.language )
				for(let i = 0; i < languages.length; i++)
					if(track.name.indexOf(languages[i][1]) !== -1)
						track.language = track.languages[i][0]

		}
		
		//video resolution information (part of the track)
		if(processingTrack == 2 && lines[i].substring(0, 6) == "|   + ") {
			let data_info = lines[i].substring(6)
			
			if( data_info.indexOf("Display width:") !== -1 )
				track.width = data_info.substring(15)	//you can wrap this in a parseInt ... but not neccesary
				
			else if( data_info.indexOf("Display height:") !== -1 )
				track.height = data_info.substring(16)	//and this

			
		}
		// console.log(lines[i])

		
	}

	//Finished getting tracks information, now onto extracting the necessary ones
	console.log(tracks)

})
