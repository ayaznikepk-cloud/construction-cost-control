export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approval_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          remarks: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          remarks?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          remarks?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          file_name: string
          id: string
          mime_type: string | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          id?: string
          mime_type?: string | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_entries: {
        Row: {
          attendance_date: string
          attendance_period_id: string
          boq_item_id: string | null
          created_at: string
          created_by: string | null
          id: string
          overtime_hours: number | null
          status: string
          worker_id: string
        }
        Insert: {
          attendance_date: string
          attendance_period_id: string
          boq_item_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          overtime_hours?: number | null
          status: string
          worker_id: string
        }
        Update: {
          attendance_date?: string
          attendance_period_id?: string
          boq_item_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          overtime_hours?: number | null
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_entries_attendance_period_id_fkey"
            columns: ["attendance_period_id"]
            isOneToOne: false
            referencedRelation: "attendance_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "attendance_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "attendance_entries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_periods: {
        Row: {
          id: string
          period_end: string
          period_start: string
          project_id: string
          status: string
        }
        Insert: {
          id?: string
          period_end: string
          period_start: string
          project_id: string
          status?: string
        }
        Update: {
          id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          entity_id: string
          entity_type: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_extra_items: {
        Row: {
          approval_date: string | null
          approval_reference: string | null
          approved_rate: number | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          project_id: string
          proposed_rate: number | null
          quantity: number
          status: string
          unit_id: string
        }
        Insert: {
          approval_date?: string | null
          approval_reference?: string | null
          approved_rate?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          project_id: string
          proposed_rate?: number | null
          quantity: number
          status?: string
          unit_id: string
        }
        Update: {
          approval_date?: string | null
          approval_reference?: string | null
          approved_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          project_id?: string
          proposed_rate?: number | null
          quantity?: number
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_extra_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_extra_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_extra_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "boq_extra_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_items: {
        Row: {
          boq_number: string
          contract_rate: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_locked: boolean
          mrs_rate: number | null
          original_quantity: number
          parent_boq_item_id: string | null
          project_id: string
          section_id: string | null
          sort_order: number
          unit_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          boq_number: string
          contract_rate: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_locked?: boolean
          mrs_rate?: number | null
          original_quantity: number
          parent_boq_item_id?: string | null
          project_id: string
          section_id?: string | null
          sort_order?: number
          unit_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          boq_number?: string
          contract_rate?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_locked?: boolean
          mrs_rate?: number | null
          original_quantity?: number
          parent_boq_item_id?: string | null
          project_id?: string
          section_id?: string | null
          sort_order?: number
          unit_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_parent_boq_item_id_fkey"
            columns: ["parent_boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_parent_boq_item_id_fkey"
            columns: ["parent_boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "boq_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "boq_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_revision_log: {
        Row: {
          boq_item_id: string
          changed_at: string
          changed_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          reason: string | null
        }
        Insert: {
          boq_item_id: string
          changed_at?: string
          changed_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Update: {
          boq_item_id?: string
          changed_at?: string
          changed_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_revision_log_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_revision_log_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "boq_revision_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_sections: {
        Row: {
          id: string
          name: string
          project_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          project_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "boq_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      boq_variations: {
        Row: {
          approval_date: string | null
          approval_reference: string | null
          approved_quantity: number | null
          boq_item_id: string
          created_at: string
          created_by: string | null
          id: string
          proposed_quantity: number
          remarks: string | null
          status: string
        }
        Insert: {
          approval_date?: string | null
          approval_reference?: string | null
          approved_quantity?: number | null
          boq_item_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          proposed_quantity: number
          remarks?: string | null
          status?: string
        }
        Update: {
          approval_date?: string | null
          approval_reference?: string | null
          approved_quantity?: number | null
          boq_item_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          proposed_quantity?: number
          remarks?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_variations_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_variations_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "boq_variations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_site_report_photos: {
        Row: {
          attachment_id: string
          daily_site_report_id: string
          id: string
        }
        Insert: {
          attachment_id: string
          daily_site_report_id: string
          id?: string
        }
        Update: {
          attachment_id?: string
          daily_site_report_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_report_photos_daily_site_report_id_fkey"
            columns: ["daily_site_report_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_site_reports: {
        Row: {
          id: string
          instructions_received: string | null
          issues_delays: string | null
          project_id: string
          remarks: string | null
          report_date: string
          site_engineer_id: string | null
          weather: string | null
        }
        Insert: {
          id?: string
          instructions_received?: string | null
          issues_delays?: string | null
          project_id: string
          remarks?: string | null
          report_date: string
          site_engineer_id?: string | null
          weather?: string | null
        }
        Update: {
          id?: string
          instructions_received?: string | null
          issues_delays?: string | null
          project_id?: string
          remarks?: string | null
          report_date?: string
          site_engineer_id?: string | null
          weather?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_site_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_site_reports_site_engineer_id_fkey"
            columns: ["site_engineer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deduction_types: {
        Row: {
          description: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deduction_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          attachment_id: string
          folder_id: string | null
          id: string
          project_id: string | null
          title: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          attachment_id: string
          folder_id?: string | null
          id?: string
          project_id?: string | null
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          attachment_id?: string
          folder_id?: string | null
          id?: string
          project_id?: string | null
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "project_documents_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          name: string
          org_id: string
          ownership: string | null
        }
        Insert: {
          id?: string
          name: string
          org_id: string
          ownership?: string | null
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
          ownership?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_logs: {
        Row: {
          boq_item_id: string | null
          equipment_id: string
          fuel_consumption: number | null
          id: string
          idle_hours: number | null
          log_date: string
          maintenance_cost: number | null
          operating_hours: number | null
          operator_worker_id: string | null
          project_id: string
          rental_cost: number | null
        }
        Insert: {
          boq_item_id?: string | null
          equipment_id: string
          fuel_consumption?: number | null
          id?: string
          idle_hours?: number | null
          log_date: string
          maintenance_cost?: number | null
          operating_hours?: number | null
          operator_worker_id?: string | null
          project_id: string
          rental_cost?: number | null
        }
        Update: {
          boq_item_id?: string | null
          equipment_id?: string
          fuel_consumption?: number | null
          id?: string
          idle_hours?: number | null
          log_date?: string
          maintenance_cost?: number | null
          operating_hours?: number | null
          operator_worker_id?: string | null
          project_id?: string
          rental_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_logs_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_logs_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "equipment_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_logs_operator_worker_id_fkey"
            columns: ["operator_worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "equipment_logs_operator_worker_id_fkey"
            columns: ["operator_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          default_classification: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          default_classification?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          default_classification?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          attachment_id: string | null
          boq_item_id: string | null
          classification: string
          created_at: string
          description: string | null
          entered_by: string | null
          expense_category_id: string
          expense_date: string
          expense_number: string | null
          id: string
          paid_from: string | null
          payee: string | null
          payment_method: string | null
          project_id: string
          status: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          attachment_id?: string | null
          boq_item_id?: string | null
          classification: string
          created_at?: string
          description?: string | null
          entered_by?: string | null
          expense_category_id: string
          expense_date: string
          expense_number?: string | null
          id?: string
          paid_from?: string | null
          payee?: string | null
          payment_method?: string | null
          project_id: string
          status?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          attachment_id?: string | null
          boq_item_id?: string | null
          classification?: string
          created_at?: string
          description?: string | null
          entered_by?: string | null
          expense_category_id?: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          paid_from?: string | null
          payee?: string | null
          payment_method?: string | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "expenses_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      goods_receipt_items: {
        Row: {
          goods_receipt_id: string
          id: string
          purchase_item_id: string
          received_quantity: number
        }
        Insert: {
          goods_receipt_id: string
          id?: string
          purchase_item_id: string
          received_quantity: number
        }
        Update: {
          goods_receipt_id?: string
          id?: string
          purchase_item_id?: string
          received_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          id: string
          purchase_id: string
          received_by: string | null
          received_date: string
        }
        Insert: {
          id?: string
          purchase_id: string
          received_by?: string | null
          received_date: string
        }
        Update: {
          id?: string
          purchase_id?: string
          received_by?: string | null
          received_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      government_receipts: {
        Row: {
          amount_received: number
          bank: string | null
          created_at: string
          created_by: string | null
          id: string
          payment_advice_attachment_id: string | null
          project_id: string
          ra_bill_id: string
          receipt_date: string
          reference_number: string | null
          remarks: string | null
        }
        Insert: {
          amount_received: number
          bank?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payment_advice_attachment_id?: string | null
          project_id: string
          ra_bill_id: string
          receipt_date: string
          reference_number?: string | null
          remarks?: string | null
        }
        Update: {
          amount_received?: number
          bank?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payment_advice_attachment_id?: string | null
          project_id?: string
          ra_bill_id?: string
          receipt_date?: string
          reference_number?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "government_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "government_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "government_receipts_ra_bill_id_fkey"
            columns: ["ra_bill_id"]
            isOneToOne: false
            referencedRelation: "ra_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_contract_measurements: {
        Row: {
          id: string
          labour_contract_rate_item_id: string
          measured_by: string | null
          measurement_date: string
          quantity: number
          remarks: string | null
        }
        Insert: {
          id?: string
          labour_contract_rate_item_id: string
          measured_by?: string | null
          measurement_date: string
          quantity: number
          remarks?: string | null
        }
        Update: {
          id?: string
          labour_contract_rate_item_id?: string
          measured_by?: string | null
          measurement_date?: string
          quantity?: number
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labour_contract_measurements_labour_contract_rate_item_id_fkey"
            columns: ["labour_contract_rate_item_id"]
            isOneToOne: false
            referencedRelation: "labour_contract_rate_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contract_measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_contract_rate_items: {
        Row: {
          agreed_rate: number
          boq_item_id: string | null
          description: string
          id: string
          labour_contract_id: string
          unit_id: string
        }
        Insert: {
          agreed_rate: number
          boq_item_id?: string | null
          description: string
          id?: string
          labour_contract_id: string
          unit_id: string
        }
        Update: {
          agreed_rate?: number
          boq_item_id?: string | null
          description?: string
          id?: string
          labour_contract_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_contract_rate_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contract_rate_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "labour_contract_rate_items_labour_contract_id_fkey"
            columns: ["labour_contract_id"]
            isOneToOne: false
            referencedRelation: "labour_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contract_rate_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_contractor_payments: {
        Row: {
          advance: boolean
          amount: number
          created_at: string
          created_by: string | null
          id: string
          labour_contract_id: string
          payment_date: string
        }
        Insert: {
          advance?: boolean
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          labour_contract_id: string
          payment_date: string
        }
        Update: {
          advance?: boolean
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          labour_contract_id?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_contractor_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contractor_payments_labour_contract_id_fkey"
            columns: ["labour_contract_id"]
            isOneToOne: false
            referencedRelation: "labour_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_contractors: {
        Row: {
          id: string
          name: string
          org_id: string
          phone: string | null
          status: string
        }
        Insert: {
          id?: string
          name: string
          org_id: string
          phone?: string | null
          status?: string
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_contractors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      labour_contracts: {
        Row: {
          agreement_reference: string | null
          id: string
          labour_contractor_id: string
          project_id: string
          scope_description: string | null
          status: string
        }
        Insert: {
          agreement_reference?: string | null
          id?: string
          labour_contractor_id: string
          project_id: string
          scope_description?: string | null
          status?: string
        }
        Update: {
          agreement_reference?: string | null
          id?: string
          labour_contractor_id?: string
          project_id?: string
          scope_description?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_contracts_labour_contractor_id_fkey"
            columns: ["labour_contractor_id"]
            isOneToOne: false
            referencedRelation: "labour_contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      labour_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          payment_date: string
          wage_sheet_item_id: string | null
          worker_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date: string
          wage_sheet_item_id?: string | null
          worker_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date?: string
          wage_sheet_item_id?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labour_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_payments_wage_sheet_item_id_fkey"
            columns: ["wage_sheet_item_id"]
            isOneToOne: false
            referencedRelation: "wage_sheet_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labour_payments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "labour_payments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      material_issue_items: {
        Row: {
          boq_item_id: string | null
          id: string
          material_id: string
          material_issue_id: string
          quantity: number
          stock_location_id: string
        }
        Insert: {
          boq_item_id?: string | null
          id?: string
          material_id: string
          material_issue_id: string
          quantity: number
          stock_location_id: string
        }
        Update: {
          boq_item_id?: string | null
          id?: string
          material_id?: string
          material_issue_id?: string
          quantity?: number
          stock_location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_issue_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issue_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "material_issue_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issue_items_material_issue_id_fkey"
            columns: ["material_issue_id"]
            isOneToOne: false
            referencedRelation: "material_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issue_items_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_issues: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          issue_date: string
          issued_to: string | null
          project_id: string
          remarks: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date: string
          issued_to?: string | null
          project_id: string
          remarks?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          issued_to?: string | null
          project_id?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_issues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      materials: {
        Row: {
          base_unit_id: string
          category: string | null
          id: string
          material_code: string
          name: string
          org_id: string
        }
        Insert: {
          base_unit_id: string
          category?: string | null
          id?: string
          material_code: string
          name: string
          org_id: string
        }
        Update: {
          base_unit_id?: string
          category?: string | null
          id?: string
          material_code?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          attachment_id: string | null
          boq_item_id: string
          calculation_notes: string | null
          checked_by: string | null
          id: string
          location: string | null
          measured_by: string | null
          measured_quantity: number
          measurement_date: string
          remarks: string | null
        }
        Insert: {
          attachment_id?: string | null
          boq_item_id: string
          calculation_notes?: string | null
          checked_by?: string | null
          id?: string
          location?: string | null
          measured_by?: string | null
          measured_quantity: number
          measurement_date: string
          remarks?: string | null
        }
        Update: {
          attachment_id?: string | null
          boq_item_id?: string
          calculation_notes?: string | null
          checked_by?: string | null
          id?: string
          location?: string | null
          measured_by?: string | null
          measured_quantity?: number
          measurement_date?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "measurements_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          id: string
          module: string
        }
        Insert: {
          action: string
          id?: string
          module: string
        }
        Update: {
          action?: string
          id?: string
          module?: string
        }
        Relationships: []
      }
      progress_entries: {
        Row: {
          boq_item_id: string
          created_at: string
          entry_date: string
          id: string
          quantity_today: number
          recorded_by: string | null
        }
        Insert: {
          boq_item_id: string
          created_at?: string
          entry_date: string
          id?: string
          quantity_today: number
          recorded_by?: string | null
        }
        Update: {
          boq_item_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          quantity_today?: number
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_entries_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "progress_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents_folders: {
        Row: {
          category: string
          id: string
          project_id: string
        }
        Insert: {
          category: string
          id?: string
          project_id: string
        }
        Update: {
          category?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          agreement_number: string | null
          approved_dnit_mrs_amount: number | null
          award_date: string | null
          bid_percentage: number | null
          commencement_date: string | null
          completion_date: string | null
          completion_period_days: number | null
          created_at: string
          created_by: string | null
          department: string | null
          division_office: string | null
          earnest_money: number | null
          id: string
          location: string | null
          org_id: string
          original_contract_amount: number
          performance_security: number | null
          project_code: string
          project_manager_id: string | null
          project_name: string
          retention_percentage: number | null
          scheme_work_name: string | null
          site_engineer_id: string | null
          status: string
          technical_sanction_amount: number | null
          technical_sanction_date: string | null
          technical_sanction_number: string | null
          tender_date: string | null
          updated_at: string
          updated_by: string | null
          work_order_number: string | null
        }
        Insert: {
          agreement_number?: string | null
          approved_dnit_mrs_amount?: number | null
          award_date?: string | null
          bid_percentage?: number | null
          commencement_date?: string | null
          completion_date?: string | null
          completion_period_days?: number | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          division_office?: string | null
          earnest_money?: number | null
          id?: string
          location?: string | null
          org_id: string
          original_contract_amount: number
          performance_security?: number | null
          project_code: string
          project_manager_id?: string | null
          project_name: string
          retention_percentage?: number | null
          scheme_work_name?: string | null
          site_engineer_id?: string | null
          status?: string
          technical_sanction_amount?: number | null
          technical_sanction_date?: string | null
          technical_sanction_number?: string | null
          tender_date?: string | null
          updated_at?: string
          updated_by?: string | null
          work_order_number?: string | null
        }
        Update: {
          agreement_number?: string | null
          approved_dnit_mrs_amount?: number | null
          award_date?: string | null
          bid_percentage?: number | null
          commencement_date?: string | null
          completion_date?: string | null
          completion_period_days?: number | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          division_office?: string | null
          earnest_money?: number | null
          id?: string
          location?: string | null
          org_id?: string
          original_contract_amount?: number
          performance_security?: number | null
          project_code?: string
          project_manager_id?: string | null
          project_name?: string
          retention_percentage?: number | null
          scheme_work_name?: string | null
          site_engineer_id?: string | null
          status?: string
          technical_sanction_amount?: number | null
          technical_sanction_date?: string | null
          technical_sanction_number?: string | null
          tender_date?: string | null
          updated_at?: string
          updated_by?: string | null
          work_order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_site_engineer_id_fkey"
            columns: ["site_engineer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          amount: number
          id: string
          material_id: string
          purchase_id: string
          quantity: number
          rate: number
          stock_location_id: string | null
          unit_id: string
        }
        Insert: {
          amount: number
          id?: string
          material_id: string
          purchase_id: string
          quantity: number
          rate: number
          stock_location_id?: string | null
          unit_id: string
        }
        Update: {
          amount?: number
          id?: string
          material_id?: string
          purchase_id?: string
          quantity?: number
          rate?: number
          stock_location_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invoice_attachment_id: string | null
          invoice_date: string
          invoice_number: string | null
          other_charges: number | null
          project_id: string
          status: string
          supplier_id: string
          transport_charges: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_attachment_id?: string | null
          invoice_date: string
          invoice_number?: string | null
          other_charges?: number | null
          project_id: string
          status?: string
          supplier_id: string
          transport_charges?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_attachment_id?: string | null
          invoice_date?: string
          invoice_number?: string | null
          other_charges?: number | null
          project_id?: string
          status?: string
          supplier_id?: string
          transport_charges?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_bill_deductions: {
        Row: {
          amount: number
          deduction_type_id: string
          description: string | null
          id: string
          ra_bill_id: string
        }
        Insert: {
          amount: number
          deduction_type_id: string
          description?: string | null
          id?: string
          ra_bill_id: string
        }
        Update: {
          amount?: number
          deduction_type_id?: string
          description?: string | null
          id?: string
          ra_bill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ra_bill_deductions_deduction_type_id_fkey"
            columns: ["deduction_type_id"]
            isOneToOne: false
            referencedRelation: "deduction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ra_bill_deductions_ra_bill_id_fkey"
            columns: ["ra_bill_id"]
            isOneToOne: false
            referencedRelation: "ra_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_bill_items: {
        Row: {
          boq_item_id: string
          certified_amount: number | null
          certified_quantity: number | null
          claimed_amount: number
          contract_quantity: number
          cumulative_claimed_quantity: number
          current_claimed_quantity: number
          id: string
          previous_billed_quantity: number
          ra_bill_id: string
          rate: number
        }
        Insert: {
          boq_item_id: string
          certified_amount?: number | null
          certified_quantity?: number | null
          claimed_amount: number
          contract_quantity: number
          cumulative_claimed_quantity: number
          current_claimed_quantity: number
          id?: string
          previous_billed_quantity?: number
          ra_bill_id: string
          rate: number
        }
        Update: {
          boq_item_id?: string
          certified_amount?: number | null
          certified_quantity?: number | null
          claimed_amount?: number
          contract_quantity?: number
          cumulative_claimed_quantity?: number
          current_claimed_quantity?: number
          id?: string
          previous_billed_quantity?: number
          ra_bill_id?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "ra_bill_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ra_bill_items_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "ra_bill_items_ra_bill_id_fkey"
            columns: ["ra_bill_id"]
            isOneToOne: false
            referencedRelation: "ra_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      ra_bills: {
        Row: {
          bill_number: string
          created_at: string
          created_by: string | null
          gross_certified_amount: number | null
          gross_claimed_amount: number | null
          id: string
          net_payable: number | null
          passed_amount: number | null
          period_from: string
          period_to: string
          project_id: string
          status: string
          submission_date: string | null
        }
        Insert: {
          bill_number: string
          created_at?: string
          created_by?: string | null
          gross_certified_amount?: number | null
          gross_claimed_amount?: number | null
          id?: string
          net_payable?: number | null
          passed_amount?: number | null
          period_from: string
          period_to: string
          project_id: string
          status?: string
          submission_date?: string | null
        }
        Update: {
          bill_number?: string
          created_at?: string
          created_by?: string | null
          gross_certified_amount?: number | null
          gross_claimed_amount?: number | null
          id?: string
          net_payable?: number | null
          passed_amount?: number | null
          period_from?: string
          period_to?: string
          project_id?: string
          status?: string
          submission_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ra_bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ra_bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ra_bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          org_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          org_id: string
        }
        Update: {
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      securities: {
        Row: {
          amount: number
          attachment_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          project_id: string
          recovered_amount: number | null
          reference: string | null
          released_amount: number | null
          status: string
          type: string
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          project_id: string
          recovered_amount?: number | null
          reference?: string | null
          released_amount?: number | null
          status?: string
          type: string
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          project_id?: string
          recovered_amount?: number | null
          reference?: string | null
          released_amount?: number | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "securities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "securities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          difference: number
          id: string
          material_id: string
          physical_quantity: number
          project_id: string
          reason: string | null
          remarks: string | null
          stock_location_id: string
          system_quantity: number
          verified_by: string | null
          verified_date: string
        }
        Insert: {
          difference: number
          id?: string
          material_id: string
          physical_quantity: number
          project_id: string
          reason?: string | null
          remarks?: string | null
          stock_location_id: string
          system_quantity: number
          verified_by?: string | null
          verified_date: string
        }
        Update: {
          difference?: number
          id?: string
          material_id?: string
          physical_quantity?: number
          project_id?: string
          reason?: string | null
          remarks?: string | null
          stock_location_id?: string
          system_quantity?: number
          verified_by?: string | null
          verified_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_adjustments_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_locations: {
        Row: {
          id: string
          name: string
          project_id: string
        }
        Insert: {
          id?: string
          name: string
          project_id: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          amount: number | null
          boq_item_id: string | null
          created_at: string
          created_by: string | null
          id: string
          material_id: string
          project_id: string
          quantity: number
          source_id: string | null
          source_table: string | null
          stock_location_id: string
          txn_date: string
          txn_type: string
          unit_cost: number | null
        }
        Insert: {
          amount?: number | null
          boq_item_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          material_id: string
          project_id: string
          quantity: number
          source_id?: string | null
          source_table?: string | null
          stock_location_id: string
          txn_date: string
          txn_type: string
          unit_cost?: number | null
        }
        Update: {
          amount?: number | null
          boq_item_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string
          project_id?: string
          quantity?: number
          source_id?: string | null
          source_table?: string | null
          stock_location_id?: string
          txn_date?: string
          txn_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "v_boq_cost_summary"
            referencedColumns: ["boq_item_id"]
          },
          {
            foreignKeyName: "stock_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_transactions_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontract_measurements: {
        Row: {
          amount_certified: number
          description: string | null
          id: string
          measured_by: string | null
          measurement_date: string
          subcontract_id: string
        }
        Insert: {
          amount_certified: number
          description?: string | null
          id?: string
          measured_by?: string | null
          measurement_date: string
          subcontract_id: string
        }
        Update: {
          amount_certified?: number
          description?: string | null
          id?: string
          measured_by?: string | null
          measurement_date?: string
          subcontract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontract_measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontract_measurements_subcontract_id_fkey"
            columns: ["subcontract_id"]
            isOneToOne: false
            referencedRelation: "subcontracts"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontract_payments: {
        Row: {
          amount: number
          id: string
          payment_date: string
          payment_type: string | null
          subcontract_id: string
        }
        Insert: {
          amount: number
          id?: string
          payment_date: string
          payment_type?: string | null
          subcontract_id: string
        }
        Update: {
          amount?: number
          id?: string
          payment_date?: string
          payment_type?: string | null
          subcontract_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontract_payments_subcontract_id_fkey"
            columns: ["subcontract_id"]
            isOneToOne: false
            referencedRelation: "subcontracts"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          id: string
          name: string
          org_id: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          org_id: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontracts: {
        Row: {
          contract_value: number
          id: string
          project_id: string
          retention_percentage: number | null
          scope_description: string | null
          subcontractor_id: string
        }
        Insert: {
          contract_value: number
          id?: string
          project_id: string
          retention_percentage?: number | null
          scope_description?: string | null
          subcontractor_id: string
        }
        Update: {
          contract_value?: number
          id?: string
          project_id?: string
          retention_percentage?: number | null
          scope_description?: string | null
          subcontractor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "subcontracts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          payment_date: string
          payment_method: string | null
          project_id: string
          reference_number: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date: string
          payment_method?: string | null
          project_id: string
          reference_number?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          project_id?: string
          reference_number?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          id: string
          name: string
          org_id: string
          phone: string | null
          status: string
          tax_registration: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          id?: string
          name: string
          org_id: string
          phone?: string | null
          status?: string
          tax_registration?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          status?: string
          tax_registration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          code: string
          id: string
          label: string
        }
        Insert: {
          code: string
          id?: string
          label: string
        }
        Update: {
          code?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      user_project_access: {
        Row: {
          project_id: string
          user_id: string
        }
        Insert: {
          project_id: string
          user_id: string
        }
        Update: {
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_upa_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_upa_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "user_project_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          org_id: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          org_id: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          org_id?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attendance_period_id: string | null
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          project_id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_period_id?: string | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_period_id?: string | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_periods_attendance_period_id_fkey"
            columns: ["attendance_period_id"]
            isOneToOne: false
            referencedRelation: "attendance_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_periods_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      wage_sheet_items: {
        Row: {
          advance_recovery: number
          basic_wages: number
          gross_wage: number
          half_days: number
          id: string
          net_payable: number
          other_deductions: number
          overtime_amount: number
          overtime_hours: number
          wage_sheet_id: string
          worker_id: string
          working_days: number
        }
        Insert: {
          advance_recovery?: number
          basic_wages: number
          gross_wage: number
          half_days?: number
          id?: string
          net_payable: number
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          wage_sheet_id: string
          worker_id: string
          working_days?: number
        }
        Update: {
          advance_recovery?: number
          basic_wages?: number
          gross_wage?: number
          half_days?: number
          id?: string
          net_payable?: number
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          wage_sheet_id?: string
          worker_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "wage_sheet_items_wage_sheet_id_fkey"
            columns: ["wage_sheet_id"]
            isOneToOne: false
            referencedRelation: "wage_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wage_sheet_items_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "wage_sheet_items_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      wage_sheets: {
        Row: {
          id: string
          wage_period_id: string
        }
        Insert: {
          id?: string
          wage_period_id: string
        }
        Update: {
          id?: string
          wage_period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wage_sheets_wage_period_id_fkey"
            columns: ["wage_period_id"]
            isOneToOne: false
            referencedRelation: "wage_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_advances: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          remarks: string | null
          txn_date: string
          txn_type: string
          worker_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          remarks?: string | null
          txn_date: string
          txn_type: string
          worker_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          remarks?: string | null
          txn_date?: string
          txn_type?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_advances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_advances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "worker_advances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_project_assignments: {
        Row: {
          assigned_from: string
          assigned_to: string | null
          project_id: string
          worker_id: string
        }
        Insert: {
          assigned_from: string
          assigned_to?: string | null
          project_id: string
          worker_id: string
        }
        Update: {
          assigned_from?: string
          assigned_to?: string | null
          project_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "worker_project_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_worker_payable"
            referencedColumns: ["worker_id"]
          },
          {
            foreignKeyName: "worker_project_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          cnic: string | null
          daily_wage_rate: number | null
          id: string
          joining_date: string | null
          mobile: string | null
          monthly_wage_rate: number | null
          name: string
          org_id: string
          overtime_rate: number | null
          photo_attachment_id: string | null
          status: string
          trade: string | null
          worker_code: string
        }
        Insert: {
          cnic?: string | null
          daily_wage_rate?: number | null
          id?: string
          joining_date?: string | null
          mobile?: string | null
          monthly_wage_rate?: number | null
          name: string
          org_id: string
          overtime_rate?: number | null
          photo_attachment_id?: string | null
          status?: string
          trade?: string | null
          worker_code: string
        }
        Update: {
          cnic?: string | null
          daily_wage_rate?: number | null
          id?: string
          joining_date?: string | null
          mobile?: string | null
          monthly_wage_rate?: number | null
          name?: string
          org_id?: string
          overtime_rate?: number | null
          photo_attachment_id?: string | null
          status?: string
          trade?: string | null
          worker_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_boq_cost_summary: {
        Row: {
          boq_item_id: string | null
          boq_number: string | null
          contract_value: number | null
          description: string | null
          direct_expense_cost: number | null
          direct_labour_cost: number | null
          earned_value: number | null
          executed_quantity: number | null
          labour_contractor_cost: number | null
          machinery_cost: number | null
          material_cost: number | null
          project_id: string | null
          subcontractor_cost_project_level: number | null
        }
        Insert: {
          boq_item_id?: string | null
          boq_number?: string | null
          contract_value?: never
          description?: string | null
          direct_expense_cost?: never
          direct_labour_cost?: never
          earned_value?: never
          executed_quantity?: never
          labour_contractor_cost?: never
          machinery_cost?: never
          material_cost?: never
          project_id?: string | null
          subcontractor_cost_project_level?: never
        }
        Update: {
          boq_item_id?: string | null
          boq_number?: string | null
          contract_value?: never
          description?: string | null
          direct_expense_cost?: never
          direct_labour_cost?: never
          earned_value?: never
          executed_quantity?: never
          labour_contractor_cost?: never
          machinery_cost?: never
          material_cost?: never
          project_id?: string | null
          subcontractor_cost_project_level?: never
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
        ]
      }
      v_project_financial_summary: {
        Row: {
          actual_cost: number | null
          amount_passed: number | null
          amount_received: number | null
          contract_value: number | null
          project_id: string | null
          project_name: string | null
          receivable: number | null
          supplier_payable: number | null
          work_executed_value: number | null
        }
        Insert: {
          actual_cost?: never
          amount_passed?: never
          amount_received?: never
          contract_value?: number | null
          project_id?: string | null
          project_name?: string | null
          receivable?: never
          supplier_payable?: never
          work_executed_value?: never
        }
        Update: {
          actual_cost?: never
          amount_passed?: never
          amount_received?: never
          contract_value?: number | null
          project_id?: string | null
          project_name?: string | null
          receivable?: never
          supplier_payable?: never
          work_executed_value?: never
        }
        Relationships: []
      }
      v_stock_balance: {
        Row: {
          average_cost: number | null
          balance_quantity: number | null
          issued_quantity: number | null
          material_id: string | null
          material_name: string | null
          project_id: string | null
          received_quantity: number | null
          stock_location_id: string | null
          stock_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_transactions_stock_location_id_fkey"
            columns: ["stock_location_id"]
            isOneToOne: false
            referencedRelation: "stock_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_supplier_payable: {
        Row: {
          outstanding_payable: number | null
          project_id: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_paid: number | null
          total_purchased: number | null
        }
        Relationships: []
      }
      v_worker_payable: {
        Row: {
          outstanding_advance: number | null
          outstanding_wage_payable: number | null
          total_paid: number | null
          total_wages_earned: number | null
          worker_id: string | null
          worker_name: string | null
        }
        Insert: {
          outstanding_advance?: never
          outstanding_wage_payable?: never
          total_paid?: never
          total_wages_earned?: never
          worker_id?: string | null
          worker_name?: string | null
        }
        Update: {
          outstanding_advance?: never
          outstanding_wage_payable?: never
          total_paid?: never
          total_wages_earned?: never
          worker_id?: string | null
          worker_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_wage_sheet: { Args: { p_period: string }; Returns: undefined }
      auth_has_project_access: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      auth_has_role: { Args: { role_names: string[] }; Returns: boolean }
      auth_is_admin: { Args: never; Returns: boolean }
      auth_org_id: { Args: never; Returns: string }
      create_purchase: {
        Args: {
          p_invoice_date: string
          p_invoice_number: string
          p_items: Json
          p_other: number
          p_paid_now: number
          p_project: string
          p_supplier: string
          p_transport: number
        }
        Returns: string
      }
      discard_wage_draft: { Args: { p_period: string }; Returns: undefined }
      ensure_store: { Args: { p_project: string }; Returns: string }
      generate_wage_sheet: {
        Args: { p_from: string; p_project_id: string; p_to: string }
        Returns: string
      }
      issue_material: {
        Args: {
          p_boq_item: string
          p_date: string
          p_issued_to: string
          p_material: string
          p_project: string
          p_quantity: number
          p_remarks: string
        }
        Returns: string
      }
      record_labour_payment: {
        Args: { p_amount: number; p_date: string; p_worker: string }
        Returns: undefined
      }
      record_supplier_payment: {
        Args: {
          p_amount: number
          p_date: string
          p_method: string
          p_project: string
          p_reference: string
          p_supplier: string
        }
        Returns: undefined
      }
      record_worker_advance: {
        Args: {
          p_amount: number
          p_date: string
          p_remarks: string
          p_worker: string
        }
        Returns: undefined
      }
      update_wage_deductions: {
        Args: { p_item: string; p_other: number; p_recovery: number }
        Returns: undefined
      }
      verify_stock: {
        Args: {
          p_material: string
          p_physical: number
          p_project: string
          p_reason: string
          p_remarks: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
