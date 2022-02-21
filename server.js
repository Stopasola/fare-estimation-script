const csv = require('csv-parser')
const fs = require('fs')


class Fare_Estimation{
    
    constructor(){

        this.results = []
        this.open_csv_file()
        
    }


    open_csv_file(){    
        fs.createReadStream('./assets/paths.csv')
        .pipe(csv({ headers: false }))
        .on('data', (data) => this.results.push([data[0], data[1], data[2], data[3] ]))
        .on('end', () => {
            console.log("CSV file successfully read");
            this.estimate_fare()
        });
    }

    delta_time(timestamp1, timestamp2) {
        var difference = parseFloat(timestamp2) - parseFloat(timestamp1);
        var secondsDifference = (difference);
    
        return secondsDifference;
    }
     

    haversine_distance(latitude_1, longitude_1, latitude_2, longitude_2){ 
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(latitude_2-latitude_1);  // deg2rad below
        var dLon = this.deg2rad(longitude_2-longitude_1); 
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(latitude_1)) * Math.cos(this.deg2rad(latitude_2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)

        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = (R * c)*1000; // Distance in m
        return d;
    }
        
    deg2rad(deg){
        return deg * (Math.PI/180)
    }

    segment_speed(delta_t, delta_s){
        var speed = (delta_s / delta_t) * 3.6 // m/s
        return speed
    }

    calculate_moving_fare(timestamp){
        var hour = this.getTimeFromDate(timestamp)
        if(hour <= 5){ // op ternario
            return 1.30
        }
        else if( hour > 5){
            return 0.77
        }
    }

    check_ride_fare(estimated_ride_fare){
        if (estimated_ride_fare < 3.47){
            return 3.47
        }
        else{
            return estimated_ride_fare
        }
    }

    calculate_idle_time(time){
        console.log(`total idle time ${time}`)
        return (time/3600) * 11.9 
    }

    getTimeFromDate(timestamp) {
        var date = new Date(timestamp * 1000);
        var hours = date.getHours();
        return hours
    }
       
    estimate_fare(){
       
        
        var estimated_ride_fare = 0
        var idle_time = 0

        for(let i = 0; i<this.results.length - 1; i++){

                var id_ride = this.results[i][0]
                var next_id_ride = this.results[i+1][0]
                 
                if(id_ride === next_id_ride){
                    var delta_t = this.delta_time(this.results[i][3], this.results[i+1][3])
                    var delta_s = this.haversine_distance(this.results[i][1], this.results[i][2], this.results[i+1][1], this.results[i+1][2])
                    var seg_speed = this.segment_speed(delta_t, delta_s)
                    
                    if (seg_speed > 100){ // op ternario
                        this.results.splice(i+1, 1)
                        i--
                    }else if (seg_speed <=10){
                        
                        idle_time += delta_t
                    }else{
                        
                        estimated_ride_fare += this.calculate_moving_fare(Number(this.results[i][3]), seg_speed)
                    }

                }else{
                    console.log('-----------------------------------')
                    //console.log(`moving fare ${estimated_ride_fare}`)

                    estimated_ride_fare += this.calculate_idle_time(idle_time)

                    //console.log(`idle time ${this.calculate_idle_time(idle_time)}`)

                    estimated_ride_fare += 1.30 // taxa fixa
                    estimated_ride_fare = this.check_ride_fare(estimated_ride_fare)

                    estimated_ride_fare = Math.round((estimated_ride_fare + Number.EPSILON) * 100) / 100

                    console.log(`${id_ride} , ${estimated_ride_fare}`)
                    estimated_ride_fare = 0
                    idle_time = 0
                }

        }
    }
}


new Fare_Estimation
