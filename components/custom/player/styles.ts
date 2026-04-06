import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gestureRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  gestureZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gestureZoneCenter: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  centerControl: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 50,
  },
  bottomBar: {
    marginTop: 'auto',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },

  // --- СТИЛИ ДЛЯ АНИМАЦИИ ПЕРЕМОТКИ ---
  seekOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  seekOverlayLeft: {
    left: 0,
    borderTopRightRadius: 200,
    borderBottomRightRadius: 200,
  },
  seekOverlayRight: {
    right: 0,
    borderTopLeftRadius: 200,
    borderBottomLeftRadius: 200,
  },
  seekContent: {
    alignItems: 'center',
  },
  seekText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  seekIcon: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
  },
  panelButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    marginHorizontal: 50,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  settingsSheet: {
    width: '50%',
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 16,
    zIndex: 25,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsList: {
    gap: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  settingsItemActive: {
    backgroundColor: 'rgba(30, 215, 96, 0.16)',
  },
  settingsItemText: {
    color: '#fff',
    fontSize: 16,
  },
  settingsValueText: {
    color: '#c7c7c7',
    fontSize: 14,
  },
  settingsEmptyText: {
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default styles;
