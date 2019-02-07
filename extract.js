let fs = require('fs'),
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
			
			if( data_info.indexOf("Track number:") !== -1 ||
			    data_info.indexOf("Track type:") !== -1 ||
			    data_info.indexOf("Codec ID:") !== -1 ||
			    data_info.indexOf("Name:") !== -1 ||
			    data_info.indexOf("Language:") !== -1 )

				console.log(data_info)
			//TODO: Actually append this data to tracks, not just print it ...
		}

		
	}

})
