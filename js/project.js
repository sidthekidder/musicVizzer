var Viz = {
  // the width and height of main svg canvas
  w : $(document).width(),
  h : $(document).height(),
  // type of visualization
  vizType : 'circle',
  dataset : [ 50 ],
  vizElements : [],
  svg : {},
  background : {},
  // audio variables
  context : {},
  analyser : {},
  sourceNode : {},
  scriptProc : {},
  request : {}
};

Viz.fillContext = function() {
  // cross-browser compatibility
  if ( ! window.AudioContext ) {
    if ( ! window.webkitAudioContext ) {
      alert( 'No audioContext found, cannot play visualization' );
    }
    window.AudioContext = window.webkitAudioContext;
  }  
};

/* 
 * setup audio using the following steps
 * create AudioContext
 * create analyser, buffer source, and script processor based on context
 * connect buffer source to analyser, analyser to context, and script processor to context
 * create musicDataArr array with length = frequencyBinCount (no of data values received)
 * store values in avgData and set radius as average of all the values * 10
 *
 */
Viz.audioSetup = function() {
  this.context = new AudioContext();
  this.analyser = this.context.createAnalyser();
  this.sourceNode = this.context.createBufferSource();
  this.scriptProc = this.context.createScriptProcessor( 2048, 1, 1 );
  this.sourceNode.connect( this.analyser );
  this.analyser.connect( this.context.destination );
  this.scriptProc.connect( this.context.destination );

  this.scriptProc.onaudioprocess = function() {
    var musicDataArr = new Uint8Array( Viz.analyser.frequencyBinCount ),
        avgData = 0;
    Viz.analyser.getByteFrequencyData( musicDataArr );
    for( var i = 0 ; i < musicDataArr.length ; i++ ) {
      avgData += musicDataArr[i];
    }
    avgData /= musicDataArr.length;
    avgData = Math.floor(avgData) * 10;

    Viz.vizElements.attr( 'r' , function( d , i ) {
                      return avgData;
                    })
                    .attr( 'fill', 'rgba(255, 255, 255, ' + (avgData*0.001) + ')');
  };
};

Viz.getAudioUrl = function() {
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('=');
  if(hashes[0] == 'id') {
    return '/fetchtrackdata?id=' + hashes[1] || null;
  } else {
    return null;
  }
};

/*
 * setup XMLHTTPRequest to fetch audio and start playing on load
 *
 */
Viz.getAudio = function() {
  // send XML request to fetch mp3 and start playing when loaded
  this.request = new XMLHttpRequest();
  this.url = this.getAudioUrl() || 'rock.mp3';
  try {
    this.request.open( 'GET', this.url, true );
  } catch( err ) {
    alert( 'File path not valid : ' + err );
  }
  this.request.responseType = 'arraybuffer';
  this.request.onload = function() {
    Viz.context.decodeAudioData( Viz.request.response, function( buffer ) {
      Viz.sourceNode.buffer = buffer;
      Viz.sourceNode.start( 0 );
    })
  };
  this.request.send();
};

/*
 * recursive background-color change 
 *
 */
Viz.recolor = function() {
  Viz.background.transition()
                  .duration( 3000 )
                  .attr( 'fill', 'hsl(' + ( Math.random() * 360 ) + ', 50%, 5%)')
                  .each( 'end', Viz.recolor );
};

/*
 * initialization of background and vizElements
 *
 */
Viz.initApp = function() {
  // setup d3
  // attach main svg element
  this.svg = d3.select( 'body' )
              .append( 'svg' )
              .attr( 'width', this.w )
              .attr( 'height', this.h );

  // background color
  this.background = this.svg.append("rect")
                             .attr("width", "100%")
                             .attr("height", "100%")
                             .attr("fill", "black");

  // create the visualisation elements - hardcoded to circles right now
  this.vizElements = this.svg.selectAll( this.vizType )
                              .data( this.dataset )
                              .enter()
                              .append( this.vizType );

  // set x, y coordinates etc
  this.vizElements.attr( 'cx' , function( d, i ) {
                return Viz.w / 2;
              })  
              .attr( 'cy' , function( d, i ) {
                return Viz.h / 2;
              })
              .attr( 'fill', 'rgba(255, 255, 255, 0.1)');

  this.fillContext();
  this.audioSetup();
  this.getAudio();
  this.recolor();
};

$(document).ready(function() {
  Viz.initApp();
});