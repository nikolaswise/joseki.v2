<script>
  import { RTCData } from '$lib/WebRTC.js'
  $: {
    console.log('I consume RTC data')
    console.log($RTCData)
  }
</script>
