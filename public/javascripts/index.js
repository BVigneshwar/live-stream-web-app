const MEDIA_CONSTRAINTS = {
    video: true
};
const MIME_TYPE = 'video/webm;codecs=vp8';
var socket;
var arrayOfBlobs = [];

function getLiveStream(){
    arrayOfBlobs = [];
    let $video_element = document.querySelector("video");
    socket = new WebSocket("ws://localhost:3000/get_live");
    
    var mediaSource, sourceBuffer;
    socket.onopen = function(event) {
        
    };

    var check = true;
    socket.onmessage = async function(event) {
        var buffer = await new Blob([event.data], {type : MIME_TYPE}).arrayBuffer();
        arrayOfBlobs.push(buffer);
        appendToSourceBuffer();
    };
        
    socket.onclose = function(event) {
            
    };

    mediaSource = new MediaSource();
    $video_element.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', function(){
        sourceBuffer = mediaSource.addSourceBuffer(MIME_TYPE);
        sourceBuffer.mode = "sequence";
        sourceBuffer.addEventListener("error", function(event){
            
        });
        sourceBuffer.addEventListener("updateend", appendToSourceBuffer);
    });

    mediaSource.addEventListener('sourceclose', function(event){
        
    });

    function appendToSourceBuffer(){
        if (mediaSource.readyState === "open" && sourceBuffer && sourceBuffer.updating === false){
            sourceBuffer.appendBuffer(new Int8Array(arrayOfBlobs.shift()));
        }
        if($video_element.buffered.length && $video_element.buffered.end(0) - $video_element.buffered.start(0) > 1200){
            sourceBuffer.remove(0, $video_element.buffered.end(0) - 1200)
        }
    }
}

function liveStream(){
    socket.close();
    navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS).then((stream) => {
        socket = new WebSocket("ws://localhost:3000/stream");  
        socket.onopen = function(e) {
            var mediaRecorder = new MediaRecorder(stream, {
                mimeType: MIME_TYPE
            });
            mediaRecorder.ondataavailable = function(event){
                socket.send(event.data);
            }
            mediaRecorder.start(1000);
        };
        
        let $video_element = document.querySelector("video");
        $video_element.srcObject = stream;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getLiveStream();
    let $live_button = document.getElementsByClassName("live-button")[0];
    $live_button.onclick = function(event){
        liveStream();
    };
});