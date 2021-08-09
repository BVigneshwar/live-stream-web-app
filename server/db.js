const mysql = require('mysql');

const CREATE_TABLE = 'create table live_table(id int not null auto_increment, host varchar(100) not null, name varchar(100) not null, description varchar(250), client_id varchar(100), session_id varchar(100) not null, time timestamp not null default current_timestamp, likes int default 0, viewers int default 0, primary key(id));'

const connectionPool = mysql.createPool({
    connectionLimit     : 10,
    host                : 'localhost',
    user                : '******',
    password            : '******',
    database            : 'live_stream',
    waitForConnections  : true
});

function getConnectionAndExecuteQuery(query, data, cbk){
    connectionPool.getConnection(function(err, connection){
        if(err){
            throw err;
        }

        function queryCallback(error, results, fields){
            if(error){
                throw error;
            }
            connection.release();
            cbk(results);
        }
        
        if(data){
            connection.query(query, data, queryCallback);
        }else{
            connection.query(query, data, queryCallback);
        }
    });
}

function getAllLive(cbk){
    getConnectionAndExecuteQuery("SELECT * FROM LIVE_TABLE WHERE client_id IS NOT NULL ORDER BY name ASC", undefined, (results) => {
        var resultObj = results.map(function(data, index){
            return {
                id : data.id,
                host : data.host,
                name : data.name,
                description : data.description,
                session_id : data.session_id,
                client_id : data.client_id,
                likes : data.likes,
                viewers : data.viewers,
                time : Date.parse(data.time)
            }
        });
        cbk(resultObj);
    });
}

function getLiveBySessionId(session_id, cbk){
    getConnectionAndExecuteQuery("SELECT * FROM LIVE_TABLE WHERE session_id = ?", [session_id], (results) => {
        var resultObj = results.map(function(data, index){
            return {
                id : data.id,
                host : data.host,
                name : data.name,
                description : data.description,
                session_id : data.session_id,
                client_id : data.client_id,
                likes : data.likes,
                viewers : data.viewers,
                time : Date.parse(data.time)
            }
        });
        cbk(resultObj[0]);
    });
}

function postLive(data, cbk){
    var {host, name, description, session_id} = data;
    getConnectionAndExecuteQuery("INSERT INTO live_table(host, name, description, session_id) VALUES(?, ?, ?, ?)", [host, name, description, session_id], (results) => {
        cbk(results);
    });
}

function updateClientId(data, cbk){
    var {session_id, client_id} = data;
    getConnectionAndExecuteQuery("UPDATE live_table SET client_id = ? WHERE session_id = ?", [client_id, session_id], (results) => {
        cbk(results);
    });
}

function deleteLiveBySessionId(session_id, cbk){
    getConnectionAndExecuteQuery("DELETE FROM live_table WHERE session_id = ?", [session_id], (results) => {
        cbk(results);
    });
}

function incrementLikeBySessionId(session_id, cbk){
    getConnectionAndExecuteQuery("UPDATE live_table SET likes = likes + 1 WHERE session_id = ?", [session_id], (results) => {
        cbk(results);
    });
}

function incrementViewersBySessionId(session_id, cbk){
    getConnectionAndExecuteQuery("UPDATE live_table SET viewers = viewers + 1 WHERE session_id = ?", [session_id], (results) => {
        cbk(results);
    });
}

function decrementViewersBySessionId(session_id, cbk){
    getConnectionAndExecuteQuery("UPDATE live_table SET viewers = viewers - 1 WHERE session_id = ?", [session_id], (results) => {
        cbk(results);
    });
}

getConnectionAndExecuteQuery("CREATE DATABASE IF NOT EXISTS live_stream", undefined, (results) => {
    getConnectionAndExecuteQuery("SHOW TABLES LIKE 'live_table'", undefined, (results) => {
        if(results.length == 0){
            getConnectionAndExecuteQuery(CREATE_TABLE, undefined, (results) => {});
        }
    });
});

exports.getAllLive = getAllLive;
exports.getLiveBySessionId = getLiveBySessionId;
exports.postLive = postLive;
exports.updateClientId = updateClientId;
exports.deleteLiveBySessionId = deleteLiveBySessionId;
exports.incrementLikeBySessionId = incrementLikeBySessionId;
exports.incrementViewersBySessionId = incrementViewersBySessionId;
exports.decrementViewersBySessionId = decrementViewersBySessionId;