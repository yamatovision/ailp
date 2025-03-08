'use client';

import { Search, FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';

interface LpFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterChange?: (filters: FilterOptions) => void;
  activeFilters?: FilterOptions;
}

export interface FilterOptions {
  status?: string;
  sortBy?: string;
  dateRange?: string;
}

export function LpFilter({
  searchQuery,
  onSearchChange,
  onFilterChange,
  activeFilters = {},
}: LpFilterProps) {
  const form = useForm<FilterOptions>({
    defaultValues: {
      status: activeFilters.status || 'all',
      sortBy: activeFilters.sortBy || 'newest',
      dateRange: activeFilters.dateRange || 'all',
    },
  });

  // フィルターの適用
  const applyFilters = (values: FilterOptions) => {
    if (onFilterChange) {
      onFilterChange(values);
    }
  };

  // 検索クエリのクリア
  const clearSearch = () => {
    onSearchChange('');
  };

  // フィルターのリセット
  const resetFilters = () => {
    form.reset({
      status: 'all',
      sortBy: 'newest',
      dateRange: 'all',
    });
    if (onFilterChange) {
      onFilterChange({
        status: 'all',
        sortBy: 'newest',
        dateRange: 'all',
      });
    }
  };

  // アクティブフィルターのカウント
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.status && activeFilters.status !== 'all') count++;
    if (activeFilters.sortBy && activeFilters.sortBy !== 'newest') count++;
    if (activeFilters.dateRange && activeFilters.dateRange !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="LP名・説明文で検索"
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={clearSearch}
          >
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {onFilterChange && (
        <div className="flex space-x-2 self-start md:self-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                フィルター
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(applyFilters)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ステータス</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="すべてのステータス" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="active">公開中</SelectItem>
                            <SelectItem value="draft">下書き</SelectItem>
                            <SelectItem value="testing">テスト中</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sortBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>並び替え</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="並び替え" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="newest">新しい順</SelectItem>
                            <SelectItem value="oldest">古い順</SelectItem>
                            <SelectItem value="name_asc">名前昇順</SelectItem>
                            <SelectItem value="name_desc">名前降順</SelectItem>
                            <SelectItem value="conversion_high">
                              コンバージョン率高い順
                            </SelectItem>
                            <SelectItem value="conversion_low">
                              コンバージョン率低い順
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>作成日</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="期間" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="today">今日</SelectItem>
                            <SelectItem value="week">今週</SelectItem>
                            <SelectItem value="month">今月</SelectItem>
                            <SelectItem value="year">今年</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                    >
                      リセット
                    </Button>
                    <Button type="submit" size="sm">
                      適用
                    </Button>
                  </div>
                </form>
              </Form>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}