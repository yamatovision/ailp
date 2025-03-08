'use client';

import { useState } from 'react';
import { useTest } from './TestContext';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

// テスト期間の計算（推奨期間は2週間）
const getRecommendedEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date;
};

const conversionGoalOptions = [
  { value: 'form_submit', label: 'フォーム送信' },
  { value: 'button_click', label: 'ボタンクリック' },
  { value: 'page_view', label: 'ページ閲覧時間' },
  { value: 'scroll_depth', label: 'スクロール深度' },
];

export default function TestSetupForm() {
  const { state, setTestSettings } = useTest();
  const [localStartDate, setLocalStartDate] = useState<Date | null>(state.startDate || new Date());
  const [localEndDate, setLocalEndDate] = useState<Date | null>(state.endDate || getRecommendedEndDate());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // テスト名の更新
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestSettings({ testName: e.target.value });
  };
  
  // コンバージョン目標の更新
  const handleGoalChange = (value: string) => {
    setTestSettings({ conversionGoal: value });
  };
  
  // 開始日の選択
  const handleStartDateSelect = (date: Date | null) => {
    setLocalStartDate(date);
    setTestSettings({ startDate: date });
    setShowStartDatePicker(false);
  };
  
  // 終了日の選択
  const handleEndDateSelect = (date: Date | null) => {
    setLocalEndDate(date);
    setTestSettings({ endDate: date });
    setShowEndDatePicker(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>テスト設定</CardTitle>
        <CardDescription>
          A/Bテストの基本設定を行います。テスト名、期間、コンバージョン目標を設定してください。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* テスト名入力 */}
        <div className="space-y-2">
          <Label htmlFor="testName">テスト名</Label>
          <Input
            id="testName"
            value={state.testName}
            onChange={handleNameChange}
            placeholder="例：ヒーローセクションテスト"
          />
        </div>
        
        {/* 期間設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">開始日</Label>
            <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="startDate"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localStartDate ? (
                    format(localStartDate, 'yyyy年MM月dd日', { locale: ja })
                  ) : (
                    <span>日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localStartDate || undefined}
                  onSelect={handleStartDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endDate">終了日</Label>
            <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="endDate"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localEndDate ? (
                    format(localEndDate, 'yyyy年MM月dd日', { locale: ja })
                  ) : (
                    <span>日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localEndDate || undefined}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) => 
                    (localStartDate ? date < localStartDate : false)
                  }
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              推奨テスト期間: 2週間（十分なデータ収集のため）
            </p>
          </div>
        </div>
        
        {/* コンバージョン目標設定 */}
        <div className="space-y-2">
          <Label htmlFor="conversionGoal">コンバージョン目標</Label>
          <Select
            value={state.conversionGoal}
            onValueChange={handleGoalChange}
          >
            {conversionGoalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            測定するコンバージョンアクションを選択してください。
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline">キャンセル</Button>
        <Button>次へ：テスト対象選択</Button>
      </CardFooter>
    </Card>
  );
}