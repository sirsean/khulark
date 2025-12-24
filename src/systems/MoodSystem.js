export default class MoodSystem {
  static determineBodyState(hunger) {
    // Body state is primarily determined by hunger level
    if (hunger >= 90) {
      return 'superfull';
    } else if (hunger >= 60) {
      return 'fed';
    } else if (hunger >= 40) {
      return 'normal';
    } else if (hunger >= 20) {
      return 'hungry';
    } else {
      return 'starving';
    }
  }

  static getBackgroundColor(bodyState) {
    // Background colors extracted from sprite images
    const colorMap = {
      'superfull': '#FDF3ED',  // Very bright warm cream/pink tint
      'fed': '#F8F1E9',        // Light warm cream
      'normal': '#F4ECDC',     // Baseline cream/beige
      'hungry': '#F6EFE8',     // Light neutral cream
      'starving': '#F8F0EA'    // Light warm beige
    };
    return colorMap[bodyState] || '#F4ECDC';
  }

  static getSpriteKey(bodyState) {
    const spriteMap = {
      'superfull': 'khulark-superfull',
      'fed': 'khulark-fed',
      'normal': 'khulark-base',
      'hungry': 'khulark-hungry',
      'starving': 'khulark-starving'
    };
    return spriteMap[bodyState] || 'khulark-base';
  }

  static getMoodDescription(hunger, affection, sanity) {
    // Overall mood based on all stats
    const avgMood = (hunger + affection + sanity) / 3;
    
    if (avgMood >= 70) {
      return 'content';
    } else if (avgMood >= 40) {
      return 'neutral';
    } else if (avgMood >= 20) {
      return 'distressed';
    } else {
      return 'critical';
    }
  }
}
