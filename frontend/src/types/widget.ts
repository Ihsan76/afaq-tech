export interface WidgetData {
  id: number;
  page: string;
  widget_type: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  is_active: boolean;
  order: number;
  config: Record<string, any>;
}
