import { ActivityIndicator, Image, StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_KEY } from './queryClient';
import Animated, { interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// TODO: Implement PexelsWallpapers
// https://www.pexels.com/api/documentation/#photos-search
const uri = 'https://api.pexels.com/v1/search?query=mobile wallpaper&orientation=portrait';

type PhotoSource = {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};

type Photo = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PhotoSource;
  liked: boolean;
  alt: string;
};

type SearchPayload = {
  total_results: number;
  page: number;
  per_page: number;
  photos: Photo[];
  next_page: string;
};

const {width: screenWidth} = Dimensions.get('screen');
const _imageWidth = screenWidth * 0.7;
const _imageHeight = _imageWidth * 1.76;
const _spacing = 12;
function Photo({item, index, scrollX}: {item: Photo, index: number, scrollX: SharedValue<number>}) {
    const stylez = useAnimatedStyle(() => { 
        const scale = interpolate(
            scrollX.value, 
            [index - 1, index, index + 1], 
            [1.6, 1, 1.6]
        );
        const rotate = `${interpolate(
            scrollX.value, 
            [index - 1, index, index + 1], 
            [15, 0, -15]
        )}deg`;
        return {
            transform: [{scale}, {rotate}]
        };
    });
  return (
    <View style={{
      width: _imageWidth,
      height: _imageHeight,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <Animated.Image source={{uri: item.src.large}} style={[stylez, {
        flex: 1,
      }]} />
    </View>
  );
}
function BackdropPhoto({
    photo,
    index,
    scrollX
}: {photo: Photo, index: number, scrollX: SharedValue<number>}) {
    const stylez = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollX.value, [index - 1, index, index + 1], [0, 1, 0]
        );
        return {opacity};
    });
    return <Animated.Image 
    key={index.toString()} 
    source={{uri: photo.src.large}} 
    style={[stylez, StyleSheet.absoluteFillObject]} 
    blurRadius={50}
    />;
}

const PexelsWallpapers = () => {
  const {data, isLoading, isError} = useQuery<SearchPayload>({
    queryKey: ['pexels-wallpapers'],
    queryFn: async () => {
      const response = await fetch(uri, {
        headers: {
          Authorization: API_KEY
        },
      }).then(res => res.json());
      console.log(response);
      return response;
    },
  });
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x / (_imageWidth + _spacing);
  });

  if(isLoading) return <View style={styles.container}><ActivityIndicator size="large" color="#0000ff" /></View>;
  if(isError) return <View style={styles.container}><Text>Error</Text></View>;

  return (
    <View style={styles.container}>
        <View style={StyleSheet.absoluteFillObject}>
            {data?.photos.map((photo,index)=>(
                <BackdropPhoto photo={photo} index={index} scrollX={scrollX} />
            ))}
        </View>
      <Animated.FlatList
        data={data?.photos}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        style={{
            flexGrow: 0,
        }}
        snapToInterval={_imageWidth + _spacing}
        decelerationRate="fast"
        contentContainerStyle={{
            gap: _spacing,
            paddingHorizontal: (screenWidth - _imageWidth) / 2,
        }}
        renderItem={({item, index}) => {
            return (
                <Photo item={item} index={index} scrollX={scrollX}/>
            );
        }}
        onScroll={onScroll}
        scrollEventThrottle={1000 / 60} // 60 fps or 16.67ms
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default PexelsWallpapers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});