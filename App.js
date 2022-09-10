import { View, Image, StyleSheet, Text, SafeAreaView, FlatList, Pressable, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { ResponseType, useAuthRequest } from "expo-auth-session";
import { myTopTracks, albumTracks } from "./utils/apiOptions";
import { REDIRECT_URI, SCOPES, CLIENT_ID, ALBUM_ID } from "./utils/constants";
import millisToMinutesAndSeconds from "./utils/millisToMinuteSeconds"
import Colors from "./Themes/colors"
import images from "./Themes/images";
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from "react-native-webview";
import { createStackNavigator } from '@react-navigation/stack';

// Endpoints for authorizing with Spotify
const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token"
};

const Song = ({ number, imageURL, name, artists, album, duration }) => (
  <View style={styles.song}>
    <View>
      <Pressable>
        <Ionicons name="play-circle" size={24} color={Colors.spotify} />
      </Pressable>
    </View>
    <View style={styles.songItem}>
      <Image source={{ uri: imageURL }} style={{ height: 60, width: 60 }}></Image>
    </View>
    <View style={[{ flex: 1 }, styles.songItem]}>
      <Text style={{ color: "white" }} numberOfLines={1}>{name}</Text>
      <Text style={{ color: Colors.gray }} numberOfLines={1}>{artists}</Text>
    </View>
    <View style={[{ flex: 1 }, styles.songItem]}>
      <Text style={{ color: "white" }} numberOfLines={1}>{album}</Text>
    </View>
    <View style={styles.songItem}>
      <Text style={{ color: "white" }} numberOfLines={1}>{duration}</Text>
    </View>
  </View>
);

export default function App() {
  const [token, setToken] = useState("");
  const [tracks, setTracks] = useState([]);
  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Token,
      clientId: CLIENT_ID,
      scopes: SCOPES,
      // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      redirectUri: REDIRECT_URI
    },
    discovery
  );

  const renderItem = ({ item, index }) => (
    <Song
      number={index + 1}
      imageURL={item.album.images[2].url}
      name={item.name}
      artists={
        item.artists.map(a => a.name).join(", ")
      }
      album={item.album.name}
      duration={millisToMinutesAndSeconds(item.duration_ms)}
    />
  )

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      setToken(access_token);
    }
  }, [response]);

  useEffect(() => {
    const fetchTracks = async () => {
      // TODO: Comment out which one you don't want to use
      // myTopTracks or albumTracks

      const res = await myTopTracks(token);
      // const res = await albumTracks(ALBUM_ID, token);
      setTracks(res);
    };

    if (token) {
      // Authenticated, make API request
      fetchTracks();
    }
  }, [token]);

  let contentDisplayed = null;

  const SongList = ({ navigation }) => {
    return (
      <View style={{ width: "100%" }}>
        <View style={styles.header}>
          <Image style={{ width: 20, height: 20, marginRight: 10 }} source={images.spotify}></Image>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>My Top Tracks</Text>
        </View>
        <FlatList
          data={tracks}
          renderItem={renderItem}
        >
        </FlatList>
      </View>
    )
  }

  const Stack = createStackNavigator();

  if (token) {
    contentDisplayed = (
      <Stack.Navigator>
        <Stack.Screen
          name="SongList"
          component={SongList}
        />
      </Stack.Navigator>
    )
  } else {
    contentDisplayed = (
      <TouchableOpacity style={styles.spotifyButton} onPress={promptAsync}>
        <Image style={{ width: 20, height: 20, marginRight: 5 }} source={images.spotify}></Image>
        <Text style={{ color: "white" }}>CONNECT WITH SPOTIFY</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {contentDisplayed}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  spotifyButton: {
    color: "white",
    backgroundColor: Colors.spotify,
    padding: 10,
    borderRadius: 99999,
    display: "flex",
    flexDirection: "row"
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 10

  },
  song: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 5,
    paddingTop: 5
  },
  songItem: {
    marginLeft: 12
  }
});
