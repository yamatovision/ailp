'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { TestProvider } from '@/components/ab-test/TestContext';
import TestSetupForm from '@/components/ab-test/TestSetupForm';
import ComponentSelector from '@/components/ab-test/ComponentSelector';
import VariantCompare from '@/components/ab-test/VariantCompare';
import TestConfirmation from '@/components/ab-test/TestConfirmation';
import TrackingSetup from '@/components/ab-test/TrackingSetup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// ステップの定義
const steps = [
  { id: "setup", label: "基本設定" },
  { id: "components", label: "対象選択" },
  { id: "variants", label: "バリアント比較" },
  { id: "confirmation", label: "確認" },
  { id: "tracking", label: "トラッキング" },
];

export default function ABTestPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [currentStep, setCurrentStep] = useState("setup");
  
  // 次のステップへ
  const goToNextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };
  
  // 前のステップへ
  const goToPrevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };
  
  // 現在のステップインデックスを取得
  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep);
  };
  
  return (
    <TestProvider initialProjectId={projectId}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">A/Bテスト設定</h1>
        
        {/* ステッププログレスバー */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full 
                    ${i <= getCurrentStepIndex() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {i + 1}
                </div>
                <div 
                  className={`
                    text-sm px-2 
                    ${i <= getCurrentStepIndex() ? 'text-primary font-medium' : 'text-muted-foreground'}
                  `}
                >
                  {step.label}
                </div>
                {i < steps.length - 1 && (
                  <div 
                    className={`h-1 w-10 ${i < getCurrentStepIndex() ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* コンテンツ */}
        <div className="mb-8">
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            <TabsList className="hidden">
              {steps.map(step => (
                <TabsTrigger key={step.id} value={step.id}>{step.label}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="setup" className="m-0">
              <TestSetupForm />
            </TabsContent>
            
            <TabsContent value="components" className="m-0">
              <ComponentSelector />
            </TabsContent>
            
            <TabsContent value="variants" className="m-0">
              <VariantCompare />
            </TabsContent>
            
            <TabsContent value="confirmation" className="m-0">
              <TestConfirmation />
            </TabsContent>
            
            <TabsContent value="tracking" className="m-0">
              <TrackingSetup />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* 前後ボタン */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={goToPrevStep}
            disabled={getCurrentStepIndex() === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            前へ
          </Button>
          
          <Button 
            onClick={goToNextStep}
            disabled={getCurrentStepIndex() === steps.length - 1}
          >
            次へ
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </TestProvider>
  );
}