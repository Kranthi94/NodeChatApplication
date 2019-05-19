console.log("Client js loaded")

const socket = io()

const $messageForm = document.querySelector('#message-form')

const $messageFormInput = $messageForm.querySelector('input')

const $messageFormButton = $messageForm.querySelector('button')

const $shareLocationButton = document.querySelector('#send-location')

const $messages = document.querySelector('#messages')

const $sidebar = document.querySelector('#sidebar')

// Mustache Templates

const messageTemplate = document.querySelector('#message-template').innerHTML

const locationTemplate = document.querySelector('#location-message-template').innerHTML

const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

$messageForm.addEventListener('submit', (e) => {

    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = $messageFormInput.value

    // const message = e.target.elements.message.value

    socket.emit('send_message', message, (error) => {

        $messageFormButton.removeAttribute('disabled')

        $messageFormInput.focus()

        if(error) {

            return console.log(error)
        }

        $messageFormInput.value = ''
    })
})

$shareLocationButton.addEventListener('click', (e) => {

    e.preventDefault()

    if(!navigator.geolocation){

        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {

        $shareLocationButton.setAttribute('disabled', 'disabled')

        socket.emit('share_location',  {

            latitude : position.coords.latitude,

            longitude : position.coords.longitude,

        }, (url) => {

            $shareLocationButton.removeAttribute('disabled') 

            console.log('Location shared successfully')
        })

    }, (error) => {

        console.log(error)
    })
})

socket.on('message', (messageObject) => {

    const html = Mustache.render(messageTemplate, {
        username : messageObject.username,
        message : messageObject.message,
        createdAt : moment(messageObject.createdAt).format('HH:mm')
    })

    $messages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('location_message', (urlObject) => {

    const html = Mustache.render(locationTemplate, {
        username : urlObject.username,
        url : urlObject.url,
        createdAt : moment(urlObject.createdAt).format('HH:mm')
    })

    $messages.insertAdjacentHTML('beforeend', html)

    autoscroll()
})

socket.on('room_data', (usersObject) => {

    const html = Mustache.render(sideBarTemplate, {
        room : usersObject.room,
        users : usersObject.users
    })

    $sidebar.insertAdjacentHTML('beforeend', html)
})

socket.emit('join', {username, room}, (error) => {

    console.log(room)

    if(error) {

        alert(error)

        location.href = "/"
    }
})

