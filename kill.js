var ps = require('ps-node');
console.log('KILL Node Processes');

ps.lookup({
    command: 'node',
}, function(err, resultList ) {
    if (err) {
        throw new Error( err );
    }

    resultList.forEach(function( process ){
        if( process ){

            console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );

            if(process.arguments[0]==='electric-mixcloud-uploader'){
                console.log('KILL',process.pid);

                ps.kill(process.pid, function( err ) {
                    if (err) {
                        throw new Error( err );
                    }
                    else {
                        console.log( 'Process with pid '+process.pid+' has been killed!');
                    }
                });
            }


        }
    });
});