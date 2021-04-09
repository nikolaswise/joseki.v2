<script>
  import ThemePicker from '../components/ThemePicker.svelte'
  import Lockup from '../components/Lockup.svelte'
  import Logo from '../components/Logo.svelte'
  import Blob from '../components/Blob.svelte'
  import Button from '../components/Button.svelte'
  import GameList from '../components/GameList.svelte'

  const dummyGames = [
    {
      "name": "/honey-gem",
      "komi": 0.5,
      "size": 19,
      "turn": "black",
      "winner": null,
      "resignation": false,
      "score": null,
      "consecutivePasses": 0,
      "players": 2,
      "accepted": {
        "black": false,
        "white": false
      },
      "history": [],
      "deadStones": []
    },
    {
      "name": "/gem-honey",
      "komi": 4.5,
      "size": 13,
      "turn": "white",
      "winner": null,
      "resignation": false,
      "score": null,
      "consecutivePasses": 0,
      "players": 2,
      "accepted": {
        "black": false,
        "white": false
      },
      "history": [1,2,3],
      "deadStones": []
    }
  ]
</script>

<style>
  section {
    display: grid;
    grid-template-columns: 1fr;
    column-gap: 2rem;
    align-items: center;
    margin-top: calc(1em + 0.75rem);
  }
  .sample {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .docs {
    width: 100%;
    overflow: scroll;
  }
</style>

<h1>
  Joseki Party Components
</h1>

<section>
  <div class="sample">
    <ThemePicker />
  </div>
  <div class="docs">
    <h2>Colors</h2>
    <pre>
| Theme               |
| ------------------- |
| Default             |
    </pre>
  </div>
</section>

<section>
  <div class="sample">
    <Blob
      count={35}
      speed={1000}
      drift={30}
      deform={90}
      animate={true}
      size="large"
      color="white"/>
  </div>
  <div class="docs">
    <h2>Blob</h2>
    <pre>
| Property  | Default   | Description  |
| --------- | --------- | ------------ |
| color     | black     | or white!    |
| animate   | false     | blobbin!     |
| size      | medium    | big? small?  |
| count     | 8         | sub-blobs    |
| speed     | 2000      | ms           |
| drift     | 35        | how much?    |
| deform    | 80        | how blobbly? |
    </pre>
  </div>
</section>

<!-- <section>
  <div class="sample">
    <Logo stacked={true}/>
  </div>
  <div class="docs">
    <h2>Logo</h2>
    <pre>
| Property  | Default   | Description          |
| --------- | --------- | -------------------- |
| small     | false     | small size           |
    </pre>
  </div>
</section> -->

<section>
  <div class="sample">
    <Lockup stacked={true}/>
    <!-- <Lockup small={true}/> -->
  </div>
  <div class="docs">
    <h2>Lockup</h2>
    <pre>
| Property  | Default   | Description          |
| --------- | --------- | -------------------- |
| small     | false     | small size           |
| stacked   | false     | stacked layout       |
    </pre>
  </div>
</section>

<section>
  <div class="sample">
    <Button
      href="/new">
      New Game
    </Button>
    <Button
      large={true}>
      Button
    </Button>
  </div>
  <div class="docs">
    <h2>Button</h2>
    <pre>
| Property  | Default   | Description          |
| --------- | --------- | -------------------- |
| small     | false     | small size           |
| stacked   | false     | stacked layout       |
    </pre>
  </div>
</section>


<section>
  <div class="sample">
    <GameList
      title="Watch Games"
      games={dummyGames} />
  </div>
  <div class="docs">
    <h2>Game List</h2>
    <pre>
| Property  | Default   | Description          |
| --------- | --------- | -------------------- |
| title     | none      | small size           |
| games     | []        | stacked layout       |
    </pre>
  </div>
</section>