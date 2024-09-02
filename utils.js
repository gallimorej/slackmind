
function getPostAtEpoch(date, hour, minute, ampm) {
    // Convert the hour to 24-hour format if PM is selected
    if (ampm === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }
  
    // Create a new Date object
    const postAt = new Date(date);
    // the date that gets retuned uses a zero-based day of the month
    postAt.setDate(postAt.getDate() + 1);
    postAt.setHours(hour);
    postAt.setMinutes(minute);
  
    // Return the epoch time
    return postAt;
}

function getPostAtMMDDYYYY(epoch) {
    // Create a new Date object
    const date = new Date(epoch * 1000);
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // JavaScript months are 0-11
    const day = ('0' + date.getDate()).slice(-2);
    const year = date.getFullYear();

    // Return the formatted date
    return `${month}/${day}/${year}`;
}

function getPostAtTime(epoch) {
    const date = new Date(epoch * 1000);
    let hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) {
      hours -= 12;
    }
  
    const timezone = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];
  
    return `${hours}:${minutes} ${ampm} ${timezone}`;
}

function getChannelName(channelId) {

  const channels = window.myAPI.getChannels();
  //console.log("how many messages in channelData? " + channels.length);
  /*
  window.myAPI.getChannels().then(channels => {
    console.log("how many messages in channelData? " + channels.length);
    const channel = channels.find(channel => channel.id === channelId);
    return channel ? channel.name : 'Unknown Channel';
  });
  */
  return channelId;
}

window.myAPI.loadChannels();
//window.myAPI.loadScheduledMessages();
window.myAPI.saveScheduledMessage();
//window.myAPI.deleteScheduledMessage(channel_id, message_id);