<?php
/**
 * Plugin Name: IntoCal Booking
 * Description: Embed an IntoCal booking widget anywhere with [intocal user="jane" event="intro-30"].
 * Version: 0.2.0
 * Author: IntoCal
 * License: MIT
 * Plugin URI: https://intocal.com
 */
if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'intocal-embed',
        'https://intocal.com/embed.js',
        [],
        '1.0.0',
        true
    );
});

add_shortcode('intocal', function ($atts) {
    $a = shortcode_atts([
        'user'   => '',
        'event'  => '',
        'mode'   => 'inline', // inline | popup
        'label'  => 'Book a meeting',
        'height' => '720',
        'theme'  => '',       // '' | light | dark
    ], $atts, 'intocal');

    if (empty($a['user']) || empty($a['event'])) {
        return '<!-- IntoCal: user and event attributes are required -->';
    }

    $user  = esc_attr($a['user']);
    $event = esc_attr($a['event']);
    $theme = $a['theme'] ? ' data-theme="' . esc_attr($a['theme']) . '"' : '';

    if ($a['mode'] === 'popup') {
        // embed.js has no popup data-attribute — popups are wired through
        // IntoCal.popup(). Rendering a [data-intocal] button would mount an
        // iframe inside the <button> instead of opening a modal.
        $id    = 'intocal-' . wp_generate_uuid4();
        $label = esc_html($a['label']);
        // JSON-encode the raw values, not the HTML-escaped ones: esc_attr() is for
        // attribute context, and double-escaping would corrupt a host containing &.
        $js    = sprintf(
            'window.addEventListener("load",function(){IntoCal.popup({host:%s,event:%s,trigger:"#%s"});});',
            wp_json_encode($a['user']),
            wp_json_encode($a['event']),
            esc_js($id)
        );
        return sprintf(
            '<button id="%s">%s</button><script>%s</script>',
            esc_attr($id),
            $label,
            $js
        );
    }

    $height = intval($a['height']);
    return "<div data-intocal=\"{$user}/{$event}\"{$theme} style=\"min-height:{$height}px\"></div>";
});
