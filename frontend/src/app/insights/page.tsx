"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrainCircuit, LineChart, Target, Zap, Loader2 } from "lucide-react"
import { fetchModelPerformance } from "@/lib/api"

interface ModelPerformance {
  roc_auc: number;
  precision: number;
  recall: number;
  f1_score: number;
  accuracy: number;
  training_date: string;
  dataset_size: number;
  feature_importance: { feature: string; importance: number }[];
  confusion_matrix: {
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
  };
}

export default function InsightsPage() {
  const [perf, setPerf] = useState<ModelPerformance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModelPerformance()
      .then(data => setPerf(data))
      .catch(() => setPerf(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (!perf) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Failed to load model performance data from backend.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Model Insights</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics and telemetry for the XGBoost + PyTorch ensemble.
          </p>
        </div>

        {/* Top line metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROC-AUC</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{perf.roc_auc}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">F1 Score</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perf.f1_score}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Precision</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perf.precision}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recall</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perf.recall}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="features">Feature Importance</TabsTrigger>
            <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
            <TabsTrigger value="metadata">Training Metadata</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>XGBoost Feature Importance</CardTitle>
                <CardDescription>Relative contribution of tabular features to the final risk score.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {perf.feature_importance.map((f: any) => (
                    <div key={f.feature} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{f.feature}</div>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-700" 
                          style={{ width: `${f.importance * 100}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm text-muted-foreground">
                        {(f.importance * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confusion">
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix</CardTitle>
                <CardDescription>Test set evaluation (N={perf.dataset_size.toLocaleString()})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <div className="rounded-lg border border-border p-4 bg-emerald-500/10 flex flex-col items-center justify-center h-32">
                    <span className="text-2xl font-bold text-emerald-400">{perf.confusion_matrix.true_negatives.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mt-1">True Negatives</span>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-red-500/10 flex flex-col items-center justify-center h-32">
                    <span className="text-2xl font-bold text-red-400">{perf.confusion_matrix.false_positives.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mt-1">False Positives</span>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-red-500/10 flex flex-col items-center justify-center h-32">
                    <span className="text-2xl font-bold text-red-400">{perf.confusion_matrix.false_negatives.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mt-1">False Negatives</span>
                  </div>
                  <div className="rounded-lg border border-border p-4 bg-emerald-500/10 flex flex-col items-center justify-center h-32">
                    <span className="text-2xl font-bold text-emerald-400">{perf.confusion_matrix.true_positives.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mt-1">True Positives</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-4 max-w-sm text-sm">
                  <span className="text-muted-foreground">Engine Version:</span>
                  <span className="font-mono">v2.0.0</span>
                  
                  <span className="text-muted-foreground">Last Training:</span>
                  <span className="font-mono">{perf.training_date}</span>
                  
                  <span className="text-muted-foreground">Dataset Size:</span>
                  <span className="font-mono">{perf.dataset_size.toLocaleString()} rows</span>
                  
                  <span className="text-muted-foreground">Architecture:</span>
                  <span className="font-mono">XGBoost + PyTorch LSTM</span>
                  
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-emerald-400 font-medium">Online</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
