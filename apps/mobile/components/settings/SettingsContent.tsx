import { useState, useCallback } from 'react';
import { View, Alert, Linking } from 'react-native';
import { Moon, Sun, Server, Info, ExternalLink } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import Constants from 'expo-constants';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGetApiHealth } from '@/gen/api/endpoints/shuchuAPI.gen';
import { API_BASE_URL } from '@/lib/api/mutator';

export function SettingsContent() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const { data: healthData, error: healthError, isLoading } = useGetApiHealth();

  const isDarkMode = colorScheme === 'dark';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleTestConnection = useCallback(() => {
    if (healthData) {
      Alert.alert('Connection Successful', `API is running: ${healthData.message}`);
    } else if (healthError) {
      Alert.alert('Connection Failed', 'Could not connect to the API server.');
    }
  }, [healthData, healthError]);

  const handleOpenDocs = useCallback(() => {
    Linking.openURL(`${API_BASE_URL}/api/doc`);
  }, []);

  return (
    <View className="gap-4">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              {isDarkMode ? (
                <Moon size={20} className="text-foreground" />
              ) : (
                <Sun size={20} className="text-foreground" />
              )}
              <Text>Dark Mode</Text>
            </View>
            <Switch checked={isDarkMode} onCheckedChange={toggleColorScheme} />
          </View>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-4">
            <View>
              <Text className="text-sm text-muted-foreground mb-2">API URL</Text>
              <Input
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://localhost:3000"
                editable={false}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Configure in app.json or environment variables
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Server size={16} className="text-muted-foreground" />
                <Text className="text-sm">
                  Status:{' '}
                  {isLoading ? (
                    <Text className="text-muted-foreground">Checking...</Text>
                  ) : healthData ? (
                    <Text className="text-green-600">Connected</Text>
                  ) : (
                    <Text className="text-destructive">Disconnected</Text>
                  )}
                </Text>
              </View>
              <Button onPress={handleTestConnection} variant="outline" size="sm">
                <Text>Test</Text>
              </Button>
            </View>

            <Button onPress={handleOpenDocs} variant="outline">
              <View className="flex-row items-center gap-2">
                <ExternalLink size={16} className="text-foreground" />
                <Text>Open API Docs</Text>
              </View>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <Info size={20} className="text-muted-foreground" />
              <View>
                <Text className="font-medium">Shuchu Mobile</Text>
                <Text className="text-sm text-muted-foreground">
                  Task management with focus tracking
                </Text>
              </View>
            </View>

            <Separator />

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Version</Text>
              <Text className="text-sm">{appVersion}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Platform</Text>
              <Text className="text-sm">Expo / React Native</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
