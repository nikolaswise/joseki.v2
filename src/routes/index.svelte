<script>
  import { RTCData } from '$lib/WebRTC.js'

  $: {
    console.log('retreive answer')
    console.log($RTCData)
  }
</script>

<main>
</main>